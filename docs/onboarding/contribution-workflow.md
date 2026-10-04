# Contribution workflow

Use this flow when handling a feature from assignment through merge and handoff.

## Workflow

1. Read the task description in Notion and understand the requested change or feature.
2. Set the Notion ticket status to `In Progress`.
3. Run `gt sync` to update `main` and restack branches.
4. Check out `main`, then create a local branch with `gt create branch_name`.
5. Submit the pull request when the change is complete with `gt submit`.
6. Set the Notion ticket status to `Pending PR`.
7. Add a clear PR description.
8. Add a screenshot from the development environment (if available).
9. Add a screenshot from the staging environment (if available).
10. Ensure all PR checklist items are completed.
11. Resolve any Graphite suggestions.
12. Ping a reviewer on Discord.
13. Resolve reviewer comments.
14. Rebase with `gt sync`, `gt restack`, and `gt submit`.
15. Merge to main with `gt merge`.
16. Set the Notion ticket status to `Done`.
