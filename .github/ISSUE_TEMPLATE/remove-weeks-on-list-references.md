---
name: Remove weeks_on_list External Script References
about: Clean up references to external script management of weeks_on_list field
title: "[CLEANUP] Remove weeks_on_list external script references"
labels: ["enhancement", "documentation", "cleanup"]
assignees: []
---

## 📋 Summary

Remove references to external script management of the `weeks_on_list` field to eliminate confusion and outdated documentation. This cleanup will make the codebase more accurate and reduce misleading information about automated management that may not be implemented.

## 🎯 Problem Statement

Current codebase contains references suggesting that `weeks_on_list` values are managed automatically by external scripts, but these scripts may not exist or be implemented. This creates confusion for contributors and users about how the field is actually managed.

### Current Issues

- **Misleading Documentation**: References to automatic management that may not exist
- **Contributor Confusion**: Unclear expectations about field management
- **Outdated Information**: Documentation that doesn't match actual implementation
- **Maintenance Burden**: Need to maintain accuracy about automation claims

## 🔍 Current References Found

### 1. README.md (Line 124)

```markdown
- **External Scripts**: Manage `weeks_on_list` values automatically
```

### 2. AI Prompt File (Line 34)

```markdown
- **weeks_on_list**: Set to 1 for all new resources (external script will manage this)
```

### 3. README.md (Line 125)

```markdown
- **Version Control**: Track resource longevity and trends
```

## ✅ Acceptance Criteria

### Phase 1: Documentation Cleanup

- [ ] Remove or update "External Scripts" reference in README.md
- [ ] Update AI prompt instruction to be more accurate
- [ ] Clarify actual management process for `weeks_on_list`
- [ ] Update any other documentation references

### Phase 2: Code Comments Review

- [ ] Review code comments for similar references
- [ ] Update inline documentation to match reality
- [ ] Ensure consistency across all files

### Phase 3: Replacement Documentation

- [ ] Add clear explanation of current `weeks_on_list` management
- [ ] Document manual process if that's how it's actually done
- [ ] Provide guidance for contributors on field updates

## 🔧 Implementation Plan

### Step 1: Remove Misleading References

```markdown
# In README.md - REMOVE or UPDATE:

- **External Scripts**: Manage `weeks_on_list` values automatically

# REPLACE WITH:

- **Manual Management**: `weeks_on_list` values are updated manually as needed
```

### Step 2: Update AI Prompt Instructions

```markdown
# In ai-practitioner-resources-json.prompt.md - UPDATE:

- **weeks_on_list**: Set to 1 for all new resources (managed manually)
```

### Step 3: Clarify Process Documentation

```markdown
# Add to README.md:

### Managing weeks_on_list Values

- New resources start with `weeks_on_list: 1`
- Values are incremented manually to track resource age
- This field helps determine NEW tag display and fade effects
```

## 🧪 Testing Requirements

### Documentation Review

- [ ] Verify all references to external scripts are removed or updated
- [ ] Confirm documentation accuracy matches actual implementation
- [ ] Check for consistency across all files

### Content Validation

- [ ] Ensure AI prompt generates appropriate `weeks_on_list` values
- [ ] Verify NEW tag logic still works with manual management
- [ ] Test that documentation doesn't create false expectations

## 📝 Files to Modify

### Primary Files

- `README.md` - Update content management section
- `.github/instructions/ai-practitioner-resources-json.prompt.md` - Update field instructions

### Secondary Files (Review Only)

- `index.html` - Check for any inline comments
- `schema.json` - Verify field description accuracy
- Issue templates - Ensure consistency with new approach

## 🚀 Implementation Steps

### Phase 1: Remove References (15 minutes)

1. **Update README.md**:

   ```bash
   # Remove or replace line 124
   - **External Scripts**: Manage `weeks_on_list` values automatically
   ```

2. **Update AI Prompt**:
   ```bash
   # Update line 34 in prompt file
   - **weeks_on_list**: Set to 1 for all new resources (managed manually)
   ```

### Phase 2: Add Clarity (15 minutes)

3. **Add Management Section**:
   ```markdown
   ### weeks_on_list Management

   - Set to 1 for all new resources
   - Increment manually to track resource age
   - Used for NEW tag display and fade effects
   ```

### Phase 3: Review and Validate (10 minutes)

4. **Search for Other References**:

   ```bash
   grep -r "external.*script" .
   grep -r "managed.*automatically" .
   ```

5. **Validate Consistency**:
   - Check all documentation aligns with manual management
   - Ensure no conflicting information remains

## 💡 Alternative Approaches

### Option 1: Complete Removal

- Remove all references to management process
- Let implementation speak for itself

### Option 2: Future-Proof Documentation

- Document current manual process
- Add note about potential future automation

### Option 3: Implement Actual Automation

- Create the external scripts referenced
- Make documentation accurate by implementing features

## 🔍 Success Metrics

- [ ] No misleading references to external script automation
- [ ] Clear documentation about actual field management
- [ ] Consistent information across all files
- [ ] No contributor confusion about automation expectations

## 🚨 Risk Considerations

### Low Risk

- Documentation changes only
- No code functionality affected
- Improves accuracy and clarity

### Mitigation

- Review all files before committing
- Ensure no functionality depends on removed references
- Test that AI prompt still generates valid resources

## 📚 Related Issues

- **Local Development Support**: Better documentation aids local development
- **Testing Implementation**: Clear field management helps with test scenarios
- **AI Automation**: Future automation should align with cleaned documentation

---

**Priority**: Medium
**Effort**: Small (30-45 minutes)
**Impact**: Improved accuracy and reduced confusion
