from dataclasses import dataclass, field
from typing import Any, Callable, Literal, Optional
from enum import Enum


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Action(str, Enum):
    BLOCK = "block"
    ALLOW = "allow"
    ASK = "ask"
    WARN = "warn"


class Decision(str, Enum):
    ALLOW = "allow"
    DENY = "deny"


@dataclass
class Condition:
    field: str
    operator: str
    value: Any
    case_sensitive: bool = True


@dataclass
class Rule:
    id: str
    name: str = ""
    description: str = ""
    enabled: bool = True
    severity: Severity = Severity.MEDIUM
    action: Action = Action.BLOCK
    tools: list[str] = field(default_factory=list)
    conditions: list[Condition] = field(default_factory=list)


@dataclass
class RuleSet:
    rules: list[Rule] = field(default_factory=list)
    version: str = "1.0"


@dataclass
class ToolDefinition:
    name: str
    description: str = ""
    input_schema: dict[str, Any] = field(default_factory=dict)
    handler: Optional[Callable[..., Any]] = None


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any] = field(default_factory=dict)
    id: Optional[str] = None


@dataclass
class ValidationResult:
    decision: Decision
    reason: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)
