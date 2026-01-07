"""
Tests for Veto core class.
"""

import os
import shutil
import tempfile
from pathlib import Path

import pytest
import yaml

from veto import Veto, VetoOptions


@pytest.fixture
def temp_veto_dir():
    """Create a temporary veto config directory for testing."""
    temp_dir = tempfile.mkdtemp(prefix="veto-test-")
    veto_dir = Path(temp_dir) / "veto"
    rules_dir = veto_dir / "rules"
    rules_dir.mkdir(parents=True)

    # Create default config
    config = {
        "version": "1.0",
        "mode": "strict",
        "validation": {"mode": "custom"},
        "custom": {
            "provider": "gemini",
            "model": "gemini-2.0-flash",
        },
        "logging": {"level": "silent"},
        "rules": {"directory": "./rules"},
    }
    with open(veto_dir / "veto.config.yaml", "w") as f:
        yaml.dump(config, f)

    yield veto_dir

    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


class TestVetoInit:
    """Tests for Veto.init() method."""

    async def test_init_with_config_directory(self, temp_veto_dir):
        """Should initialize with config from directory."""
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        assert veto is not None
        assert isinstance(veto, Veto)

    async def test_init_handles_missing_config(self, temp_veto_dir):
        """Should handle missing config gracefully."""
        os.remove(temp_veto_dir / "veto.config.yaml")
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        assert veto is not None

    async def test_init_loads_rules(self, temp_veto_dir):
        """Should load rules from directory."""
        rules = {
            "rules": [
                {
                    "id": "test-rule",
                    "name": "Test Rule",
                    "enabled": True,
                    "action": "block",
                    "tools": ["test_tool"],
                }
            ]
        }
        with open(temp_veto_dir / "rules" / "test.yaml", "w") as f:
            yaml.dump(rules, f)

        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        assert len(veto._rules.all_rules) == 1
        assert veto._rules.all_rules[0].id == "test-rule"


class TestVetoWrap:
    """Tests for Veto.wrap() method."""

    async def test_wrap_preserves_tool_attributes(self, temp_veto_dir):
        """Should wrap tools and preserve their attributes."""

        class MockTool:
            name = "test_tool"
            description = "Test tool"

            async def handler(self, args):
                return "result"

        tool = MockTool()
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        wrapped = veto.wrap([tool])

        assert len(wrapped) == 1
        assert wrapped[0].name == "test_tool"

    async def test_wrap_executes_handler(self, temp_veto_dir):
        """Should execute handler when no rules apply."""
        call_count = 0

        class MockTool:
            name = "no_rules_tool"
            description = "Tool with no rules"

            async def handler(self, args):
                nonlocal call_count
                call_count += 1
                return "success"

        tool = MockTool()
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        wrapped = veto.wrap([tool])

        result = await wrapped[0].handler({})
        assert result == "success"
        assert call_count == 1


class TestVetoHistory:
    """Tests for Veto history tracking."""

    async def test_tracks_allowed_calls(self, temp_veto_dir):
        """Should track allowed tool calls."""

        class MockTool:
            name = "tracked_tool"
            description = "Tracked tool"

            async def handler(self, args):
                return "ok"

        tool = MockTool()
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        wrapped = veto.wrap([tool])

        await wrapped[0].handler({})

        stats = veto.get_history_stats()
        assert stats.total_calls == 1
        assert stats.allowed_calls == 1
        assert stats.denied_calls == 0

    async def test_clear_history(self, temp_veto_dir):
        """Should clear history."""

        class MockTool:
            name = "clear_test_tool"
            description = "Tool for clear test"

            async def handler(self, args):
                return "ok"

        tool = MockTool()
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        wrapped = veto.wrap([tool])

        await wrapped[0].handler({})
        assert veto.get_history_stats().total_calls == 1

        veto.clear_history()
        assert veto.get_history_stats().total_calls == 0

    async def test_get_history_entries(self, temp_veto_dir):
        """Should return history entries."""

        class MockTool:
            name = "history_tool"
            description = "Tool for history test"

            async def handler(self, args):
                return "ok"

        tool = MockTool()
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        wrapped = veto.wrap([tool])

        await wrapped[0].handler({"key": "value"})

        stats = veto.get_history_stats()
        assert stats.total_calls == 1
        assert "history_tool" in stats.calls_by_tool


class TestVetoModes:
    """Tests for Veto operating modes."""

    async def test_strict_mode(self, temp_veto_dir):
        """Strict mode should be default."""
        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        assert veto._mode == "strict"

    async def test_log_mode_config(self, temp_veto_dir):
        """Should respect log mode from config."""
        config = {
            "version": "1.0",
            "mode": "log",
            "validation": {"mode": "custom"},
            "custom": {"provider": "gemini", "model": "gemini-2.0-flash"},
            "logging": {"level": "silent"},
            "rules": {"directory": "./rules"},
        }
        with open(temp_veto_dir / "veto.config.yaml", "w") as f:
            yaml.dump(config, f)

        veto = await Veto.init(VetoOptions(config_dir=str(temp_veto_dir)))
        assert veto._mode == "log"
