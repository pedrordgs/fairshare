# ISSUES

Issues JSON can be retrieved using the command `gh issue list --state open --json number,title,body,comments`. Parse it to get open issues with their bodies and comments.

Use the comman `git log --grep="RALPH" -n 10 --format="%H%n%ad%n%B---" --date=short` to get the last 10 RALPH commits (SHA, date, full message). Review these to understand what work has been done.

# TASK BREAKDOWN

Break down the issues into tasks. An issue may contain a single task (a small bugfix or visual tweak) or many, many tasks (a PRD or a large refactor).

Make each task the smallest possible unit of work. We don't want to outrun our headlights. Aim for one small change per task.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Tracer bullets for new features

Tracer bullets comes from the Pragmatic Programmer. When building systems, you want to write code that gets you feedback as quickly as possible. Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

3. Polish and quick wins
4. Refactors

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

# BRANCH SAFETY RULE (MANDATORY)

You MUST NOT commit directly to main or master.

Before making any changes:

1. Detect the current branch using: `git branch --show-current`
2. If the branch is "main" or "master":
   - Create a new branch: `ralph/issue-<issue_number>-<short-task-slug>`
   - Switch to it.
3. If you are already on a non-main branch:
   - Create a new branch anyway for this issue.

All work must happen on a new branch created specifically for this issue.

If a commit is made to main or master output: "ERROR: COMMITTED TO MAIN" and stop.

# EXECUTION

Complete the task.

If you find that the task is larger than you expected (for instance, requires a refactor first), output "HANG ON A SECOND".

Then, find a way to break it into a smaller chunk and only do that chunk (i.e. complete the smaller refactor).

# FEEDBACK LOOPS

Extract feedback loops from `AGENTS.md` and `README.md` files and run them before comitting.

# COMMIT

Make a git commit. The commit message must:

1. Start with `RALPH:` prefix
2. Include task completed + PRD reference
3. Key decisions made
4. Files changed
5. Blockers or notes for next iteration

Keep it concise.

# PULL REQUEST

After committing:

1. Push the feature branch.
2. Create a Pull Request.
3. Link the PR to the GitHub issue.
4. Assign the PR to the GitHub issue.

Use the GitHub CLI.

The PR must:
- Have a title related to the issue and the task it implements
- Always start the body with:
  - If this PR completes ALL tasks for the issue: "Closes #<issue_number>"
  - Else, if this PR does NOT complete the issue: "Partial progess on #<issue_number>"
- Always include the commit message in the PR body
- Be assigned to the issue

Use:
```shell
gh pr create \
--title "<issue title>" \
--body "<issue body" \
--base master \
--assignee @me
```

# THE ISSUE

Leave a comment on the GitHub issue with what was done.

# SINGLE RUN GUARANTEE

This agent run must complete ONE AND ONLY ONE task.

After:
- selecting one task
- executing that task
- committing once
- creating pr
- updating or closing the issue

You MUST STOP.

Do not:
- select another task
- continue working
- suggest future improvements
- re-run prioritization
- loop

This is a single execution, not a continuous workflow. Terminate immediately after the commit, pr creation and issue update.
