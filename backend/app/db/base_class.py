from sqlalchemy import Integer
from sqlalchemy.orm import DeclarativeBase, declared_attr


class Base(DeclarativeBase):
    """Modern SQLAlchemy declarative base with auto-generated table names."""

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
