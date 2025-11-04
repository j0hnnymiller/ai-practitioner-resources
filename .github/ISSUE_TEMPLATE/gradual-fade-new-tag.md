---
name: Gradual Fade Effect for NEW Tags Based on Age
about: Implement a gradual fade effect for the NEW tag that becomes more transparent as resources age on the list
title: "Enhancement: Gradually Fade NEW Tag Based on Weeks on List"
labels: ["enhancement", "ui-ux", "visual-improvement"]
assignees: ""
---

## 🎯 Problem Statement

Currently, the "NEW" tag on resources has a binary display logic:

- **Week 1**: Bright red "NEW" tag with pulse animation
- **Week 2+**: No tag at all

This creates an abrupt transition that doesn't provide visual continuity for users tracking newer content. Resources that are 2-3 weeks old might still be considered "relatively new" but lose all visual indication of their recent addition.

## 💡 Proposed Solution

Implement a **gradual fade effect** for the NEW tag that:

1. **Starts at full opacity** for `weeks_on_list === 1`
2. **Gradually fades** over several weeks (suggested 4-6 weeks)
3. **Completely disappears** after a defined threshold
4. **Maintains visual hierarchy** while providing smooth transition

### Visual Progression Example

```
Week 1: 🔴 NEW (100% opacity, red, pulsing)
Week 2: 🟠 NEW (80% opacity, orange-red, no pulse)
Week 3: 🟡 NEW (60% opacity, orange, no pulse)
Week 4: 🟤 NEW (40% opacity, brown-orange, no pulse)
Week 5: ⚫ NEW (20% opacity, gray, no pulse)
Week 6+: No tag
```

## 🛠️ Technical Implementation

### 1. CSS Classes for Fade Stages

Replace the single `.new-tag` class with multiple classes:

```css
.new-tag {
  display: inline-block;
  color: white;
  font-size: 0.7em;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  transition: all 0.3s ease;
}

.new-tag-week1 {
  background: #e74c3c;
  opacity: 1;
  animation: pulse 2s infinite;
}

.new-tag-week2 {
  background: #e67e22;
  opacity: 0.85;
}

.new-tag-week3 {
  background: #f39c12;
  opacity: 0.7;
}

.new-tag-week4 {
  background: #d35400;
  opacity: 0.55;
}

.new-tag-week5 {
  background: #8e44ad;
  opacity: 0.4;
}

/* Optional: Very faint for week 6 */
.new-tag-week6 {
  background: #95a5a6;
  opacity: 0.25;
}
```

### 2. JavaScript Logic Update

Update the resource rendering logic in `index.html`:

```javascript
// Current implementation (line ~596-599)
${
  resource.weeks_on_list === 1
    ? '<span class="new-tag">NEW</span>'
    : ""
}

// Proposed new implementation
${getNewTagHtml(resource.weeks_on_list)}
```

Add helper function:

```javascript
function getNewTagHtml(weeksOnList) {
  if (weeksOnList > 6) return ""; // No tag after 6 weeks

  const weekClass = `new-tag-week${weeksOnList}`;
  return `<span class="new-tag ${weekClass}">NEW</span>`;
}
```

### 3. Alternative: Mathematical Fade Approach

For more granular control, use mathematical fade calculation:

```javascript
function getNewTagHtml(weeksOnList) {
  const MAX_WEEKS = 6;
  if (weeksOnList > MAX_WEEKS) return "";

  // Calculate opacity: 100% at week 1, 0% at week MAX_WEEKS+1
  const opacity = Math.max(0, (MAX_WEEKS - weeksOnList + 1) / MAX_WEEKS);

  // Calculate color transition from red to gray
  const redIntensity = Math.floor(231 * opacity + 149 * (1 - opacity)); // 231 = #e74c3c red, 149 = #95a5a6 gray
  const greenIntensity = Math.floor(76 * opacity + 165 * (1 - opacity));
  const blueIntensity = Math.floor(60 * opacity + 166 * (1 - opacity));

  const backgroundColor = `rgb(${redIntensity}, ${greenIntensity}, ${blueIntensity})`;
  const animationClass = weeksOnList === 1 ? "pulse-animation" : "";

  return `<span class="new-tag ${animationClass}" style="background-color: ${backgroundColor}; opacity: ${opacity}">NEW</span>`;
}
```

## ⚙️ Configuration Options

Add configuration variables for customization:

```javascript
const NEW_TAG_CONFIG = {
  maxWeeks: 6, // Total weeks to show tag
  fadeSteps: 5, // Number of discrete fade steps
  useMathematicalFade: false, // Use math vs discrete classes
  showPulseWeeks: 1, // Weeks to show pulse animation
  colors: {
    start: "#e74c3c", // Week 1 color
    end: "#95a5a6", // Final week color
  },
};
```

## ✅ Acceptance Criteria

- [ ] NEW tag appears for resources with `weeks_on_list` from 1 to 6 weeks
- [ ] Tag gradually fades in opacity over the 6-week period
- [ ] Color transitions from bright red to muted gray
- [ ] Pulse animation only appears for week 1
- [ ] Smooth CSS transitions between states
- [ ] No performance impact on page rendering
- [ ] Works correctly with existing filter and sorting functionality
- [ ] Maintains accessibility (readable text contrast)
- [ ] Configuration is easily adjustable via constants

## 🎨 Visual Specifications

### Opacity Progression

- Week 1: `opacity: 1.0` (100%)
- Week 2: `opacity: 0.85` (85%)
- Week 3: `opacity: 0.7` (70%)
- Week 4: `opacity: 0.55` (55%)
- Week 5: `opacity: 0.4` (40%)
- Week 6: `opacity: 0.25` (25%)
- Week 7+: No tag displayed

### Color Progression

- Week 1: `#e74c3c` (Bright Red)
- Week 2: `#e67e22` (Orange-Red)
- Week 3: `#f39c12` (Orange)
- Week 4: `#d35400` (Dark Orange)
- Week 5: `#8e44ad` (Purple)
- Week 6: `#95a5a6` (Gray)

### Animation Rules

- **Pulse Animation**: Only for `weeks_on_list === 1`
- **Smooth Transitions**: CSS transitions for hover and state changes
- **Performance**: Use CSS transforms instead of changing layout properties

## 🔄 Migration Strategy

1. **Phase 1**: Add new CSS classes alongside existing ones
2. **Phase 2**: Update JavaScript logic with feature flag
3. **Phase 3**: Test with different week configurations
4. **Phase 4**: Remove old implementation and cleanup

## 📊 Expected Benefits

- **Better User Experience**: Smooth visual progression instead of abrupt changes
- **Content Discovery**: Users can identify relatively new content (2-4 weeks old)
- **Visual Hierarchy**: Maintains clear distinction between very new and older content
- **Reduced Cognitive Load**: Gradual changes are easier to process visually
- **Professional Appearance**: More sophisticated and polished interface

## 🧪 Testing Scenarios

- [ ] Test with resources at different week values (1-10 weeks)
- [ ] Verify fade progression looks smooth and natural
- [ ] Check accessibility with screen readers
- [ ] Test color contrast ratios meet WCAG guidelines
- [ ] Validate performance with large numbers of resources
- [ ] Ensure proper behavior with filtering and sorting

## 🔧 Optional Enhancements

- **Hover Effects**: Temporarily restore full opacity on hover
- **Theme Support**: Adapt colors for light/dark themes
- **Custom Duration**: Allow users to configure fade duration
- **Analytics**: Track user engagement with different age resources
- **A/B Testing**: Compare engagement with old vs new tag system

---

**💡 This enhancement will create a more intuitive and visually appealing way to highlight newer content while maintaining awareness of relatively recent additions.**
