from pydantic import EmailStr
from sqlmodel import Field, SQLModel, UniqueConstraint


class ExpenseGroupBase(SQLModel):
    name: str


class ExpenseGroup(ExpenseGroupBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_by: int = Field(foreign_key="user.id")


class ExpenseGroupMember(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("group_id", "user_id"),)

    id: int | None = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="expensegroup.id", ondelete="CASCADE")
    user_id: int = Field(foreign_key="user.id")


class ExpenseGroupCreate(ExpenseGroupBase):
    pass


class ExpenseGroupUpdate(SQLModel):
    name: str | None = None


class ExpenseGroupPublic(ExpenseGroupBase):
    id: int
    created_by: int


class ExpenseGroupMemberPublic(SQLModel):
    user_id: int
    name: str
    email: EmailStr


class ExpenseGroupDetail(ExpenseGroupPublic):
    members: list[ExpenseGroupMemberPublic] = []


class AddMemberRequest(SQLModel):
    user_id: int
