# Change Log

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 0.3.1 - 2023-12-18

- Fixed bug in multi-line kill behavior where we were appending to the kill ring even if
  we had yanked in between.
- Made the default multi-line kill behavior disabled.

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
