Generate a comprehensive list of the best books, articles, blog posts, and podcasts that are good resources for using AI to generate code. Output the results as a JSON object that conforms to the AI Practitioner Resources schema.

**IMPORTANT: Use only REAL, EXISTING resources with genuine URLs. Never use placeholder domains like example.com or fictional resources. Include actual books from publishers like O'Reilly, Manning, Pragmatic Programmers; real articles from established blogs; official documentation; and genuine podcasts.**

Each resource should be evaluated and scored based on these criteria:

- Practical hands-on coding value (weight: 40%)
- Clarity and accessibility (weight: 25%)
- Depth and completeness (weight: 20%)
- Relevance and recency (weight: 15%)

Apply scores using this scale:

- 90-100: Excellent, top-tier resources with exceptional practical value
- 75-89: Solid, useful resources with good practical application
- 0-74: Weaker resources, less practical or more theoretical

Focus on resources that cover:

- AI-powered coding tools and techniques
- GitHub Copilot and similar AI assistants
- Prompt engineering for code generation
- AI in software development workflows
- Practical applications of generative AI in programming

Required JSON Structure:

The output must be a JSON object with these four required properties:

1. **introduction**: A string containing a brief explanation of the list's purpose and value
2. **resources**: An array of resource objects, each containing:
   - **type**: Must be one of: "Book", "Article", "Blog", "Podcast"
   - **title**: The full title of the resource
   - **source**: A REAL, working URL to the actual resource (e.g., official docs, publisher websites, established blogs like martinfowler.com, stackoverflow.blog, openai.com/blog). NEVER use example.com, placeholder URLs, or fictional links.
   - **score**: Integer from 0-100 based on the criteria above
   - **weeks_on_list**: Set to 1 for all new resources (external script will manage this)
   - **blurb**: A concise 1-2 sentence description (10-300 characters) explaining what the resource covers and why it's valuable for AI developers
3. **legend**: A string containing HTML markup that renders the scoring system legend, including:
   - Color-coded score ranges (use emoji or CSS for colors)
   - Explanation of scoring criteria and weightings
   - Visual representation of the scoring scale
   - Must use proper HTML formatting (no Markdown)
4. **analysis**: A string containing analysis of this week's list, such as:
   - Notable trends or patterns in the resources
   - New additions or changes from previous weeks
   - Insights about the AI coding landscape
   - Distribution of resource types and scores

Important Formatting Requirements:

- **Use HTML formatting, NOT Markdown**: All text content should use HTML tags instead of Markdown syntax
- **Bold text**: Use `<strong>` tags instead of `**bold**`
- **Emphasis**: Use `<em>` tags instead of `*italic*`
- **Lists**: Use `<ul>` and `<li>` tags instead of `-` or `*`
- **Headers**: Use `<h4>`, `<h5>` etc. instead of `####`
- **Code**: Use `<code>` tags instead of backticks

Output Requirements:

- Generate a single, valid JSON object conforming to the schema
- All four properties (introduction, resources, legend, analysis) must be present
- The resources array should contain 15-25 high-quality resources
- HTML in the legend should be properly escaped for JSON
- \*\*Analysis should provide meaningful insights about the current selection
- **Analysis content must use HTML formatting** with `<strong>` tags for bold text and proper HTML structure
- **No Markdown syntax** should be used in any text fields (introduction, legend, analysis, blurb)

The JSON output must be valid and conform exactly to the AI Practitioner Resources schema structure.
