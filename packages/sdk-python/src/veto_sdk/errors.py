from typing import Optional

from veto_sdk.types import ValidationResult


class VetoError(Exception):
    pass


class ToolCallDeniedError(VetoError):
    def __init__(
        self,
        tool_name: str,
        call_id: str,
        validation_result: ValidationResult,
    ):
        self.tool_name = tool_name
        self.call_id = call_id
        self.validation_result = validation_result
        super().__init__(
            f"Tool call '{tool_name}' denied: {validation_result.reason}"
        )


class RuleSchemaError(VetoError):
    def __init__(
        self,
        message: str,
        file_path: Optional[str] = None,
        path: Optional[str] = None,
    ):
        self.file_path = file_path
        self.path = path
        full_message = message
        if file_path:
            full_message = f"{message} in {file_path}"
            if path:
                full_message = f"{message} in {file_path}.{path}"
        super().__init__(full_message)
