from __future__ import annotations

from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, NonNegativeInt, PositiveInt

NonEmptyText = Annotated[str, Field(min_length=1)]


def normalize_optional_text(value: Any) -> Any:
    if isinstance(value, str):
        normalized = value.strip()
        return normalized or None

    return value


class DomainModel(BaseModel):
    """Base Pydantic model used by the domain and transport layers."""

    model_config = ConfigDict(
        extra="forbid",
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class LookupModel(DomainModel):
    """Base model for lookup tables such as roles and statuses."""

    id: PositiveInt
    name: NonEmptyText


class PaginatedResult[DomainModelT: DomainModel](DomainModel):
    """Simple paginated result wrapper for repository list queries."""

    items: list[DomainModelT]
    total: NonNegativeInt
    page: PositiveInt
    page_size: PositiveInt
