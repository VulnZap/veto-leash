"""
Veto SDK for Python - A guardrail system for AI agent tool calls.

This is the Python implementation of the Veto guardrail system.
It intercepts and validates tool calls made by AI models before execution.
"""

from veto_sdk.core import Veto
from veto_sdk.errors import RuleSchemaError, ToolCallDeniedError
from veto_sdk.types import Rule, RuleSet, ToolCall, ToolDefinition, ValidationResult

__version__ = "0.1.0"

__all__ = [
    "Veto",
    "ToolCallDeniedError",
    "RuleSchemaError",
    "Rule",
    "RuleSet",
    "ToolDefinition",
    "ToolCall",
    "ValidationResult",
]
