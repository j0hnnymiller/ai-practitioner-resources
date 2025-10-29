This is the original prompt used to generate the AI Practitioner Resources list. It's been replaced by the JSON-specific prompt .github\instructions\ai-practitioner-resources.prompt.md

Provide a list containing the best books, articles, blog posts, and podcasts that are good resources for using AI to generate code.

Organize the books by practical hands-on coding value using these four categories:
1. Getting Started (Beginner-Friendly)
2. Practical Developer Workflow
3. Prompt Engineering & Applied AI
4. Advanced & Theoretical Foundations

The list should be grouped by Category. Each entry should have these columns:
- Type (Book, Article, Blog, Podcast)
- Title
- Source (as a link to a non-Amazon source)
- Score (a number from 1 to 100, with a color applied consistently)
- Weeks_on_list (an integer value that will be updated externally)

Apply the color gradient consistently using these rules:
- 🟢 Green = scores 90–100 (excellent, top-tier resources)
- 🟡 Yellow = scores 75–89 (solid, useful but not top-tier)
- 🔴 Red = scores 0–74 (weaker, less practical or more theoretical)

At the beginning of the output, include:
1. An **Introductory section** that explains the purpose of the list.
2. An **Analysis of the content** of the list, pointing out anything notable in the list.

At the end of the output, include:
1. A **Legend** explaining the meaning of the score colors.
2. An **Explanation of how the score was calculated**, based on criteria such as:
   - Practical hands-on coding value (weight: 40%)
   - Clarity and accessibility (weight: 25%)
   - Depth and completeness (weight: 20%)
   - Relevance and recency (weight: 15%)
3. The **exact prompt used to generate the output**, displayed in a code block.

Additionally, after generating the list, also output a machine-readable JSON array of the resources with these fields:
- type
- title
- source
- score
- weeks_on_list

Do not calculate or increment `weeks_on_list` yourself. Instead, assume an external script will:
- Increment `weeks_on_list` by 1 for resources still on the list
- Add new resources with `weeks_on_list = 1`
- Remove resources no longer on the list

At the very end of the output, include a reminder:
"Run your update script to merge this list with your stored file and push the updated file to your GitHub Gist using the GitHub CLI."

Format the output as:
- A clean Markdown table under each Category heading
- Followed by the legend, scoring explanation, the prompt, the JSON array, and the reminder.
