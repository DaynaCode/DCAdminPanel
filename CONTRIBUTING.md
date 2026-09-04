# Contributing to DCAdminPanel

Thanks for your interest in contributing! This document covers the process
for contributing to the Persian RTL fork of django-unfold.

## Code of Conduct

Be respectful, constructive, and helpful. We're all here to build something
useful for the Persian Django community.

## How to Contribute

### Reporting Bugs

1. Search [existing issues](https://github.com/DaynaCode/DCAdminPanel/issues)
   to avoid duplicates.
2. Open a new issue with:
   - **Clear title** describing the problem
   - **Steps to reproduce** the bug
   - **Expected behavior** vs **actual behavior**
   - **Environment info:**
     - Django version (`pip show django | grep Version`)
     - Unfold version (`pip show django-unfold | grep Version`)
     - Python version (`python --version`)
     - Browser and OS
   - **Screenshots** if applicable
   - **Log excerpts** (redact sensitive info)

### Suggesting Features

1. Open a [discussion](https://github.com/DaynaCode/DCAdminPanel/discussions)
   first to gauge interest.
2. If there's interest, open an issue with the `enhancement` label.
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternatives you've considered

### Pull Requests

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DCAdminPanel.git
   cd DCAdminPanel
   git remote add upstream https://github.com/DaynaCode/DCAdminPanel.git
   ```
3. **Create a branch**:
   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/issue-123
   ```
4. **Make changes** following the [Code Style](docs/DEVELOPMENT.md#5-code-style) guide
5. **Add tests** for new features
6. **Run tests**:
   ```bash
   pytest tests/ --no-cov
   ```
7. **Run linters**:
   ```bash
   pre-commit run --all-files
   ```
8. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add Today button to Jalali calendar

   Adds a Today button that jumps to today's date and selects it.
   The button shows the full Persian date for clarity.

   Closes #123
   "
   ```
9. **Push** to your fork:
   ```bash
   git push origin feature/my-feature
   ```
10. **Open a Pull Request** against the `main` branch (or
    `feature/persian-rtl-jalali` if your change is Persian-specific)

## Pull Request Checklist

Before submitting, verify:

- [ ] Tests pass (`pytest tests/ --no-cov`)
- [ ] Pre-commit hooks pass (`pre-commit run --all-files`)
- [ ] New features have tests
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow Conventional Commits
- [ ] No hardcoded English strings in templates (use `{% trans %}`)
- [ ] CSS uses logical properties (no `ml-`, `mr-`, `left-`, `right-`)
- [ ] Persian translations added (if new user-facing strings)

## Code Style

See [DEVELOPMENT.md → Code Style](docs/DEVELOPMENT.md#5-code-style).

## Translation Contributions

See [TRANSLATIONS.md](docs/TRANSLATIONS.md) for how to add a new language
or improve existing translations.

## Review Process

1. A maintainer will review your PR within 1-3 days
2. Address review comments by pushing more commits
3. Once approved, a maintainer will merge your PR

## License

By contributing, you agree that your contributions will be licensed under
the MIT License.

## Questions?

- Open a [discussion](https://github.com/DaynaCode/DCAdminPanel/discussions)
- Email: daynacode@example.com

Thank you for contributing! 🎉
