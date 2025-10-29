Generate a comprehensive list of the best books, articles, blog posts, and podcasts that are good resources for using AI to generate code. Output the results as a JSON object that conforms to the AI Practitioner Resources schema.

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
   - **source**: A valid URL to the resource (preferably non-Amazon sources for books)
   - **score**: Integer from 0-100 based on the criteria above
   - **weeks_on_list**: Set to 1 for all new resources (external script will manage this)
3. **legend**: A string containing HTML markup that renders the scoring system legend, including:
   - Color-coded score ranges (use emoji or CSS for colors)
   - Explanation of scoring criteria and weightings
   - Visual representation of the scoring scale
4. **analysis**: A string containing analysis of this week's list, such as:
   - Notable trends or patterns in the resources
   - New additions or changes from previous weeks
   - Insights about the AI coding landscape
   - Distribution of resource types and scores

Output Requirements:

- Generate a single, valid JSON object conforming to the schema
- All four properties (introduction, resources, legend, analysis) must be present
- The resources array should contain 15-25 high-quality resources
- HTML in the legend should be properly escaped for JSON
- Analysis should provide meaningful insights about the current selection

The JSON output must be valid and conform exactly to the AI Practitioner Resources schema structure.
