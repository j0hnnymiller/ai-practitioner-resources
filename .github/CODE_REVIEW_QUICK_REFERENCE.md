# Code Review Quick Reference

## 📁 Files Created

| File                                     | Size   | Purpose                                     |
| ---------------------------------------- | ------ | ------------------------------------------- |
| `.github/instructions/code-review.md`    | 13 KB  | Comprehensive review guidelines & standards |
| `.github/prompts/code-review.prompt.md`  | 8.5 KB | AI prompt for structured reviews            |
| `.github/prompts/modes/code-reviewer.md` | 9.6 KB | Interactive chat mode                       |
| `.github/CODE_REVIEW_RESOURCES.md`       | -      | This guide (index)                          |

**Total**: ~31 KB of high-quality code review documentation

---

## 🎯 Quick Start

### For Reviewing a PR

```bash
1. Open the PR
2. Reference: .github/instructions/code-review.md
3. Follow the Review Checklist
4. Use the Red Flags section
5. Apply Approval Criteria
```

### For AI-Assisted Review

```bash
@copilot /code-reviewer [paste code or PR link]
```

Or provide code and reference:

- Prompt: `.github/prompts/code-review.prompt.md`
- Chat Mode: `.github/prompts/modes/code-reviewer.md`

### For Best Practice Questions

```bash
@copilot /code-reviewer "How should I structure [feature]?"
```

---

## 📋 What's Covered

### ✅ Code Review Instruction File

- 8 code quality standards (JS, HTML/CSS, JSON, Node.js)
- Review checklist (7 categories)
- Common issues & anti-patterns
- Focus areas (frontend, scripts, schema)
- Red flags & approval criteria

### ✅ Code Review Prompt

- 8 review dimensions
- 7-step review process
- Architecture analysis
- Common issues to flag
- Structured approval template

### ✅ Code Reviewer Chat Mode

- 4 interaction patterns
- Decision framework with scoring
- Response templates
- Common topics & solutions
- Red flag escalations
- Learning objectives

---

## 🔍 Architecture Standards Summary

### Module Organization

```
Core (Pure)        → Services (Mockable) → Components (UI) → Utils (Helpers)
Business Logic         External APIs         Rendering         Shared Code
Testable, No Side      Single Resp.           Minimal State     Stateless
Effects               Mockable               Presentation
```

### Code Quality Rules

- **Functions**: Under 20 lines
- **Complexity**: Cyclomatic < 10
- **Naming**: Descriptive, camelCase
- **Comments**: Explain "why", not "what"
- **Testing**: Core modules 100% covered

### Red Flags 🚩

- DOM access in core modules
- Business logic in components
- Global variables
- Hardcoded secrets
- No error handling
- Untestable code

---

## 💡 Review Decision Matrix

| Scenario            | Action                | Reference                                     |
| ------------------- | --------------------- | --------------------------------------------- |
| Core logic no tests | Request tests         | Instruction §Testing, Prompt §Testing         |
| DOM in core module  | Refactor to component | Instruction §Architecture, Mode §Architecture |
| Hardcoded API key   | Use env vars          | Mode §Security Issues                         |
| Function > 30 lines | Split function        | Prompt §Code Quality                          |
| No error handling   | Add try-catch         | Mode §Error Handling                          |
| Vague variable name | Rename clearly        | Instruction §Code Style                       |

---

## 📚 Key References

### Architecture

- `src/README.md` - Module documentation (398 lines)
- `REFACTORING_SUMMARY.md` - Design decisions

### Testing

- `tests/example.test.js` - Testing patterns (302 lines)
- `tests/api.test.js` - API mocking examples

### Standards

- `index.html` - Static web viewer
- `resources.schema.json` - Data validation rules
- `scripts/` - Automation scripts
- `.github/copilot-instructions.md` - Project guidelines

---

## 🚀 Activation

### Interactive Chat

```
1. Share code or PR link
2. Ask specific question or request review
3. Reference chat mode (code-reviewer.md)
4. Get interactive guidance
5. Iterate based on feedback
```

### Structured Review

```
1. Follow instruction file checklist
2. Apply code quality standards
3. Check red flags section
4. Make approval decision
5. Document feedback
```

---

## 📊 Coverage Areas

| Area               | Covered In         | Details                        |
| ------------------ | ------------------ | ------------------------------ |
| **Architecture**   | Instruction + Chat | Module fit, boundaries, layers |
| **Code Quality**   | Prompt + Chat      | Functions, complexity, naming  |
| **Testing**        | Instruction + Chat | Coverage, patterns, mocks      |
| **Security**       | Chat Mode          | Secrets, validation, XSS       |
| **Error Handling** | Instruction + Chat | Try-catch, logging, recovery   |
| **Documentation**  | Instruction + Chat | JSDoc, comments, README        |
| **Performance**    | Instruction        | Optimization, caching          |
| **Automation**     | Instruction        | Script patterns, rate limiting |

---

## ✨ Features

✅ **Comprehensive** - All aspects of code review
✅ **Specific** - Examples and remediation steps
✅ **Actionable** - Clear checklists and templates
✅ **Educational** - Learn while reviewing
✅ **Flexible** - Human or AI-assisted
✅ **Scalable** - Team-wide consistency
✅ **Integrated** - Works with existing project modes

---

## 🔗 Integration

### With Project Manager Mode

- Project Manager: Issues → Prioritization → Labels
- Code Reviewer: Code → Quality → Feedback
- Together: Complete development workflow

### With Issue Creation

- Issues created per markdown-first process
- Reviewed using code review resources
- Approved issues merged to main
- All standards maintained

---

## 📝 Usage Examples

### Example 1: Complex Function Review

```
Issue: Function is 50+ lines
Action: Reference Instruction §Code Quality
Response: "Functions should be under 20 lines.
          Extract validation to separate function,
          extraction logic to helper. See core/filters.js."
```

### Example 2: Architecture Question

```
Question: "Where should filtering logic go?"
Action: Use Chat Mode §Pattern Questions
Response: "Filtering belongs in core/filters.js
          as pure functions. Components call it
          and pass results. See example in tests/example.test.js."
```

### Example 3: Security Concern

```
Issue: API key in code
Action: Reference Mode §Security Analysis
Response: "Never hardcode secrets. Use environment
          variables: process.env.OPENAI_API_KEY.
          See scripts/generate-resources.js pattern."
```

---

## 🎓 Learning Path

1. **Read**: Instruction file overview (5 min)
2. **Study**: Review checklist (10 min)
3. **Practice**: Review sample code with checklist (15 min)
4. **Discuss**: Use chat mode for questions (interactive)
5. **Apply**: Review real PR using all resources (varies)

---

## 📞 Questions?

**About Architecture**: See `src/README.md` + Chat Mode
**About Standards**: See Instruction File + Prompt
**About Patterns**: See Chat Mode + `tests/example.test.js`
**About Automation**: See Instruction File + `scripts/README.md`

---

**Last Updated**: November 4, 2025
**Status**: ✅ Complete and ready for use
