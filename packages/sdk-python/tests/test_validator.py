"""
Tests for ValidationEngine.
"""

import pytest
from datetime import datetime

from veto.core.validator import (
    ValidationEngine,
    ValidationEngineOptions,
    create_passthrough_validator,
    create_blocklist_validator,
    create_allowlist_validator,
)
from veto.types.config import (
    ValidationContext,
    ValidationResult,
    NamedValidator,
)
from veto.utils.logger import create_logger


@pytest.fixture
def validation_engine():
    """Create a validation engine for testing."""
    logger = create_logger("silent")
    return ValidationEngine(
        ValidationEngineOptions(logger=logger, default_decision="allow")
    )


@pytest.fixture
def sample_context():
    """Create a sample validation context."""
    return ValidationContext(
        tool_name="test_tool",
        arguments={"key": "value"},
        call_id="test-call-123",
        timestamp=datetime.now(),
    )


class TestValidationEngine:
    """Tests for ValidationEngine class."""

    async def test_no_validators_returns_default(
        self, validation_engine, sample_context
    ):
        """Should return default decision when no validators."""
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "allow"

    async def test_passthrough_validator(self, validation_engine, sample_context):
        """Passthrough validator should allow all calls."""
        validation_engine.add_validator(create_passthrough_validator())
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "allow"

    async def test_blocklist_validator(self, validation_engine, sample_context):
        """Blocklist validator should deny listed tools."""
        validation_engine.add_validator(
            create_blocklist_validator(["test_tool"], "Tool is blocked")
        )
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "deny"
        assert "blocked" in result.final_result.reason.lower()

    async def test_allowlist_validator(self, validation_engine, sample_context):
        """Allowlist validator should deny unlisted tools."""
        validation_engine.add_validator(
            create_allowlist_validator(["other_tool"], "Not in allowlist")
        )
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "deny"

    async def test_allowlist_allows_listed(self, validation_engine, sample_context):
        """Allowlist validator should allow listed tools."""
        validation_engine.add_validator(
            create_allowlist_validator(["test_tool"], "Not in allowlist")
        )
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "allow"

    async def test_custom_validator(self, validation_engine, sample_context):
        """Should support custom validators."""

        def custom_validate(ctx: ValidationContext) -> ValidationResult:
            if ctx.arguments.get("key") == "value":
                return ValidationResult(decision="allow")
            return ValidationResult(decision="deny", reason="Invalid key")

        validation_engine.add_validator(
            NamedValidator(
                name="custom",
                validate=custom_validate,
                priority=1,
            )
        )
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "allow"

    async def test_async_validator(self, validation_engine, sample_context):
        """Should support async validators."""

        async def async_validate(ctx: ValidationContext) -> ValidationResult:
            return ValidationResult(decision="allow", reason="Async approved")

        validation_engine.add_validator(
            NamedValidator(
                name="async_validator",
                validate=async_validate,
                priority=1,
            )
        )
        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "allow"
        assert result.final_result.reason == "Async approved"

    async def test_validator_priority(self, validation_engine, sample_context):
        """Validators should run in priority order."""
        calls = []

        def make_validator(name: str, priority: int):
            def validate(ctx):
                calls.append(name)
                return ValidationResult(decision="allow")

            return NamedValidator(name=name, validate=validate, priority=priority)

        validation_engine.add_validator(make_validator("third", 30))
        validation_engine.add_validator(make_validator("first", 10))
        validation_engine.add_validator(make_validator("second", 20))

        await validation_engine.validate(sample_context)
        assert calls == ["first", "second", "third"]

    async def test_deny_stops_chain(self, validation_engine, sample_context):
        """Deny should stop validator chain."""
        calls = []

        def deny_validator(ctx):
            calls.append("deny")
            return ValidationResult(decision="deny", reason="Denied")

        def after_validator(ctx):
            calls.append("after")
            return ValidationResult(decision="allow")

        validation_engine.add_validator(
            NamedValidator(name="deny", validate=deny_validator, priority=1)
        )
        validation_engine.add_validator(
            NamedValidator(name="after", validate=after_validator, priority=2)
        )

        result = await validation_engine.validate(sample_context)
        assert result.final_result.decision == "deny"
        assert calls == ["deny"]  # "after" should not be called

    def test_remove_validator(self, validation_engine):
        """Should remove validators by name."""
        validation_engine.add_validator(create_passthrough_validator())
        assert len(validation_engine.get_validators()) == 1

        validation_engine.remove_validator("passthrough")
        assert len(validation_engine.get_validators()) == 0

    def test_clear_validators(self, validation_engine):
        """Should clear all validators."""
        validation_engine.add_validator(create_passthrough_validator())
        validation_engine.add_validator(
            create_blocklist_validator(["tool"], "blocked")
        )
        assert len(validation_engine.get_validators()) == 2

        validation_engine.clear_validators()
        assert len(validation_engine.get_validators()) == 0
