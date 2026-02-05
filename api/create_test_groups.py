#!/usr/bin/env python3
"""Script to create 50 test groups for a user to test infinite scroll."""

from sqlmodel import Session, select
from auth.models import User
from groups.models import ExpenseGroup, ExpenseGroupCreate, ExpenseGroupMember
from db.dependencies import engine


def main():
    email = "pedro@rodrigues.com"

    with Session(engine) as session:
        # Find the user
        user = session.exec(select(User).where(User.email == email)).one_or_none()

        if not user:
            print(f"User with email {email} not found!")
            return

        print(f"Found user: {user.name} (ID: {user.id})")

        # Create 50 groups
        for i in range(1, 51):
            group_in = ExpenseGroupCreate(name=f"Test Group {i}")
            db_group = ExpenseGroup.model_validate(group_in, update={"created_by": user.id})
            session.add(db_group)
            session.flush()  # Get the ID without committing

            # Add user as member
            assert db_group.id is not None
            member = ExpenseGroupMember(group_id=db_group.id, user_id=user.id)
            session.add(member)

            print(f"Created group {i}: {group_in.name}")

        session.commit()
        print(f"\nSuccessfully created 50 groups for user {email}!")


if __name__ == "__main__":
    main()
