import pytest
from veto_sdk import Veto, ToolCallDeniedError, RuleSchemaError
from veto_sdk.types import Decision, ToolDefinition, ToolCall, ValidationResult


class TestVeto:
    @pytest.mark.asyncio
    async def test_init_without_config(self, tmp_path):
        veto = await Veto.init(config_dir=str(tmp_path / "veto"))
        assert veto.get_mode() == "strict"
        assert len(veto.get_loaded_rules()) == 0

    @pytest.mark.asyncio
    async def test_wrap_tools_returns_definitions_and_implementations(self):
        veto = Veto()
        tools = [
            ToolDefinition(
                name="test_tool",
                description="A test tool",
                input_schema={"type": "object"},
            )
        ]
        
        definitions, implementations = veto.wrap_tools(tools)
        
        assert len(definitions) == 1
        assert definitions[0].name == "test_tool"
        assert definitions[0].handler is None

    @pytest.mark.asyncio
    async def test_validate_tool_call_allows_without_rules(self):
        veto = Veto()
        
        result = await veto.validate_tool_call(ToolCall(
            name="read_file",
            arguments={"path": "/etc/passwd"},
        ))
        
        assert result.decision == Decision.ALLOW


class TestToolCallDeniedError:
    def test_error_message(self):
        result = ValidationResult(
            decision=Decision.DENY,
            reason="Blocked by security policy",
        )
        error = ToolCallDeniedError("read_file", "call_123", result)
        
        assert "read_file" in str(error)
        assert "Blocked by security policy" in str(error)
        assert error.tool_name == "read_file"
        assert error.call_id == "call_123"


class TestRuleSchemaError:
    def test_error_with_file_path(self):
        error = RuleSchemaError("Invalid severity", "rules/test.yaml", "rules[0].severity")
        
        assert "Invalid severity" in str(error)
        assert "rules/test.yaml" in str(error)
        assert "rules[0].severity" in str(error)
