# Change Log

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 1.0.0 - 2025-08-09

- Breaking: Renamed configuration `betterKillRing.multiLineKill.enabled` to `betterKillRing.coalesceKills.enabled` and reversed the default behavior (now enabled by default). Consecutive kills from the same location are coalesced into a single kill-ring entry.
- Changed: Default kill ring size is now 50 (was 20).
- Added: New command to clear the kill ring: "Better Kill Ring: Clear the kill ring" (`better-kill-ring.clear`). No default keybinding.

### 0.3.2 - 2023-12-19

- Fixed a bug with multi-line kill behavior not working correctly

### 0.3.1 - 2023-12-18

- Fixed bug in multi-line kill behavior where we were appending to the kill ring even if
  we had yanked in between
- Made the default multi-line kill behavior disabled

### 0.3.0 - 2023-12-18

- Added configuration
- Configurable multi-line kill behavior
- Configurable kill ring size
- Changed default kill ring size to 20 (was 10)

### 0.2.1 - 2023-12-15

- Updated dependencies

### 0.2.0 - 2021-03-11

- You can now kill empty lines

### 0.1.1 - 2021-02-19

- Fixed README formatting and links

### 0.1.0 - 2021-02-19

- Initial release of Better Kill Ring! 🎉
