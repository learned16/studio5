# B Review Permission and Mutation Guard

## Current Codex permission behavior

For local Codex clients, subagents inherit the parent turn's current sandbox
policy and permission mode. Live runtime overrides are reapplied when a child is
spawned, even when a custom-agent file contains a different default such as
`sandbox_mode = "read-only"`.

Keep the B agent's read-only default and explicit no-write developer
instructions, but do not claim an enforced per-subagent read-only sandbox when
the writable parent turn overrides it. This contract follows the current
[official OpenAI Subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents),
verified on 2026-08-08.

## Required behavioral guard

Use B only for review. B must never edit, create, delete, commit, push, open a
PR, or merge, regardless of the tools exposed by the inherited parent mode.

Immediately before spawning B, write a deterministic baseline outside the
repository:

```text
node .agents/skills/studio5-delivery/scripts/review-mutation-guard.mjs capture --output <temporary-path-outside-repository>
```

After B finishes, verify the baseline before accepting its verdict:

```text
node .agents/skills/studio5-delivery/scripts/review-mutation-guard.mjs verify --before <same-temporary-path>
```

The integrity-checked fingerprint covers HEAD, porcelain Git status, the binary
tracked diff, and the paths and contents of untracked non-ignored files. Any
mismatch or invalid baseline is a review failure. Discard B's verdict, report
the mutation, and do not deliver or push until an authorized writer restores
and reverifies the intended state.

## Deferred isolation

An independently invoked reviewer whose parent starts in a read-only sandbox
is stronger isolation. Track that separately; do not make it a hidden or
impossible acceptance gate for a review spawned under a writable parent.
