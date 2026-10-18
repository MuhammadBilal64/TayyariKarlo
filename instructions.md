
# Development Workflow Instructions

We will build this project phase by phase, task by task, and commit by commit. Follow these instructions throughout the entire development process.

## 1. Initial Analysis and Planning

Before writing or modifying any code:

- Inspect the existing repository, project structure, architecture, dependencies, coding conventions, current Git branch, and working tree status.
- Understand the project requirements and identify all necessary work.
- Create a `phases.md` file in the project root.
- Break the project into logical phases based on dependencies and implementation order.
- Divide each phase into small, independent tasks.
- Include each task's description, acceptance criteria, dependencies, and relevant testing requirements.
- Track each task using these statuses: Pending, In Progress, and Completed.

IMPORTANT: During this stage, only analyze the project and create the phase plan. Do not begin implementation. Present `phases.md` to me and wait for my approval before proceeding.

## 2. Phase-by-Phase Development

- Each phase must have its own dedicated Git branch.
- Follow a consistent branch naming convention, such as `phase/01-project-setup` and `phase/02-authentication`.
- Work on only one phase at a time.
- Complete tasks sequentially within the current phase.
- Do not implement multiple independent tasks together.
- Do not start the next phase until I confirm that the previous phase's PR has been merged.

## 3. Task-by-Task Workflow

Follow this process for every task.

### Step 1: Explain the Task
Before making changes, explain what you will implement, why it is needed, which files are expected to change, and how completion will be verified.

### Step 2: Implement Only the Current Task
- Make only the changes required for the current task.
- Follow the existing architecture and coding standards.
- Avoid unrelated refactoring, unnecessary dependencies, and scope creep.
- Do not implement features planned for future tasks.
- Preserve existing functionality unless the task explicitly requires changes.
- Ask me before making significant architectural decisions or potentially breaking changes.

### Step 3: Test and Review
- Run relevant tests, linting, type checks, and build commands when applicable.
- Review the implementation for bugs, regressions, security concerns, and unnecessary complexity.
- Inspect `git diff` to ensure that only the intended task changes are included.
- Fix issues introduced by the task before requesting a commit.
- Report validation results honestly. Never claim that a check passed unless it was actually performed.

### Step 4: Update phases.md
- Keep `phases.md` updated as development progresses.
- Mark tasks as In Progress or Completed accurately.
- Mark a task Completed only after implementation and required validation are finished.
- Include relevant phase-plan updates in the appropriate task commit.

### Step 5: Report and Provide Commit Commands
After completing each task, provide:
1. A summary of the implementation.
2. The files changed and their purposes.
3. Tests and validation results.
4. Any remaining issues or limitations.
5. The exact Git commands required to review and commit the changes.
6. A clear, descriptive commit message.

Use consistent commit messages, preferably following Conventional Commits where appropriate.

IMPORTANT CHECKPOINT:
After providing the commit command, STOP and wait for my confirmation that I have executed it. Do not edit additional files, start another task, or continue implementation until I confirm.

Do not use a blind `git add .` when unrelated changes might exist. Ensure only the intended files are staged.

## 4. Git Branching and Safety Rules

- Create one dedicated branch per phase.
- Keep commits small and focused on individual tasks.
- Never combine unrelated changes into one commit.
- Check the Git status before making changes and before committing.
- Never overwrite, discard, or reset my existing work.
- Never perform destructive Git operations, force-push, or overwrite files without my explicit permission.
- Do not switch branches or assume a merge has occurred without checking or receiving my confirmation.
- Provide Git commands for me to execute; do not perform repository operations on my behalf when they require my manual action.

## 5. Phase Completion and Pull Requests

After all tasks in a phase are completed:

1. Review all changes made during the phase.
2. Run the relevant tests and validation checks.
3. Check for bugs, regressions, incomplete tasks, and unintended changes.
4. Confirm that `phases.md` accurately reflects the completed work.
5. Summarize the phase's deliverables and outstanding issues, if any.
6. Provide the necessary Git commands for checking the branch and preparing for a PR.
7. Confirm whether the phase is ready for review.

I will handle these actions myself:
- Creating the pull request (PR).
- Reviewing and approving the PR.
- Merging the PR.
- Performing any other repository operations I choose to handle manually.

Do not create PRs or merge branches on my behalf. Wait for my confirmation that the PR has been merged before starting the next phase.

## 6. Code Quality and Scope Control

- Define clear acceptance criteria before implementing each task.
- Prefer simple, maintainable, readable, and secure solutions.
- Follow the project's established conventions and avoid unnecessary changes.
- Do not install new dependencies unless they are necessary and justified.
- Do not silently change requirements or skip planned tasks.
- If a requirement is ambiguous, ask me before making assumptions that could affect implementation.
- If a task is blocked, explain the problem and wait for my input when necessary.
- If validation fails, investigate and fix the issue before requesting a commit.
- Never hide errors, failed checks, or known limitations.

## 7. Mandatory Workflow and Checkpoints

The complete workflow must follow this sequence:

Initial Analysis
    ↓
Create phases.md
    ↓
Present Plan for My Approval
    ↓
Create Phase Branch
    ↓
Explain Current Task
    ↓
Implement One Task
    ↓
Test and Review
    ↓
Update phases.md
    ↓
Provide Summary and Commit Command
    ↓
STOP AND WAIT FOR MY CONFIRMATION
    ↓
Proceed to the Next Task Only After Confirmation
    ↓
Complete All Tasks in the Phase
    ↓
Final Phase Review
    ↓
I Create and Merge the PR
    ↓
I Confirm the Merge
    ↓
Begin the Next Phase

## 8. Most Important Rules

1. Plan first, code second.
2. One phase at a time.
3. One task at a time.
4. One task per commit.
5. Test and review before requesting a commit.
6. Provide exact commands and clear commit messages.
7. Stop after every commit command and wait for my confirmation.
8. Never create PRs or merge branches yourself.
9. Never start another phase before I confirm the previous phase has been merged.
10. Keep `phases.md` accurate throughout the project.
11. Preserve my existing work and never perform destructive operations without permission.
12. Do not rush, skip checkpoints, or implement multiple tasks at once.

## 9. Starting Instructions

Start by analyzing the existing project and creating `phases.md`.

Do not implement any features yet.

Present the proposed phases and tasks, explain the plan briefly, and wait for my approval. Once I approve the plan, we will begin Phase 1 and follow the workflow above strictly until the entire project is completed.
