from pathlib import Path
from typing import Any, Callable, Optional

import yaml

from veto_sdk.errors import ToolCallDeniedError
from veto_sdk.types import (
    Decision,
    Rule,
    ToolCall,
    ToolDefinition,
    ValidationResult,
)


class Veto:
    def __init__(
        self,
        config_dir: str = "./veto",
        mode: str = "strict",
    ):
        self.config_dir = Path(config_dir)
        self.mode = mode
        self.rules: list[Rule] = []
        self._registered_tools: dict[str, ToolDefinition] = {}

    @classmethod
    async def init(
        cls,
        config_dir: str = "./veto",
        mode: Optional[str] = None,
    ) -> "Veto":
        instance = cls(config_dir=config_dir, mode=mode or "strict")
        await instance._load_config()
        await instance._load_rules()
        return instance

    async def _load_config(self) -> None:
        config_path = self.config_dir / "veto.config.yaml"
        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)
                if config and "mode" in config:
                    self.mode = config["mode"]

    async def _load_rules(self) -> None:
        rules_dir = self.config_dir / "rules"
        if not rules_dir.exists():
            return

        for rule_file in rules_dir.glob("**/*.yaml"):
            with open(rule_file) as f:
                data = yaml.safe_load(f)
                if data and "rules" in data:
                    for rule_data in data["rules"]:
                        if rule_data.get("enabled", True):
                            self.rules.append(self._parse_rule(rule_data))

    def _parse_rule(self, data: dict[str, Any]) -> Rule:
        from veto_sdk.types import Action, Condition, Severity

        conditions = []
        for cond in data.get("conditions", []):
            conditions.append(Condition(
                field=cond["field"],
                operator=cond["operator"],
                value=cond["value"],
                case_sensitive=cond.get("case_sensitive", True),
            ))

        return Rule(
            id=data["id"],
            name=data.get("name", ""),
            description=data.get("description", ""),
            enabled=data.get("enabled", True),
            severity=Severity(data.get("severity", "medium")),
            action=Action(data.get("action", "block")),
            tools=data.get("tools", []),
            conditions=conditions,
        )

    def wrap_tools(
        self,
        tools: list[ToolDefinition],
    ) -> tuple[list[ToolDefinition], dict[str, Callable[..., Any]]]:
        definitions: list[ToolDefinition] = []
        implementations: dict[str, Callable[..., Any]] = {}

        for tool in tools:
            self._registered_tools[tool.name] = tool
            definitions.append(ToolDefinition(
                name=tool.name,
                description=tool.description,
                input_schema=tool.input_schema,
            ))

            if tool.handler:
                async def wrapped_handler(
                    args: dict[str, Any],
                    _tool: ToolDefinition = tool,
                ) -> Any:
                    result = await self.validate_tool_call(ToolCall(
                        name=_tool.name,
                        arguments=args,
                    ))
                    if result.decision == Decision.DENY:
                        raise ToolCallDeniedError(
                            _tool.name,
                            "",
                            result,
                        )
                    return await _tool.handler(args)  # type: ignore

                implementations[tool.name] = wrapped_handler

        return definitions, implementations

    async def validate_tool_call(self, call: ToolCall) -> ValidationResult:
        applicable_rules = [
            r for r in self.rules
            if not r.tools or call.name in r.tools
        ]

        if not applicable_rules:
            return ValidationResult(decision=Decision.ALLOW)

        return ValidationResult(decision=Decision.ALLOW)

    def get_mode(self) -> str:
        return self.mode

    def get_loaded_rules(self) -> list[Rule]:
        return self.rules.copy()
