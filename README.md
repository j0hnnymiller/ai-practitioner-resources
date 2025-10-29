# AI Practitioner Resources - Web Viewer

This HTML file renders your JSON data as a beautiful, interactive web page that can be hosted anywhere or loaded from a GitHub gist.

## 🚀 Quick Setup

### Step 1: Create a GitHub Gist

1. Go to https://gist.github.com
2. Create a new gist
3. Add your `resources.json` file
4. Make sure the gist is public
5. Save the gist

### Step 2: Get the Raw URL

1. In your gist, click on the "Raw" button next to your JSON file
2. Copy the URL (it should look like: `https://gist.githubusercontent.com/username/gistid/raw/resources.json`)

### Step 3: Configure the HTML

1. Open `resources-viewer.html` in a text editor
2. Find the `GIST_CONFIG` section (around line 155)
3. Replace the URL with your gist's raw URL:
   ```javascript
   const GIST_CONFIG = {
     url: "https://gist.githubusercontent.com/yourusername/yourgistid/raw/resources.json",
   };
   ```

### Step 4: Deploy

Choose one of these options:

#### Option A: GitHub Pages

1. Create a new GitHub repository
2. Upload the `resources-viewer.html` file
3. Rename it to `index.html`
4. Enable GitHub Pages in repository settings
5. Your site will be available at `https://yourusername.github.io/repository-name`

#### Option B: Netlify Drop

1. Go to https://app.netlify.com/drop
2. Drag and drop your `resources-viewer.html` file
3. Get an instant live URL

#### Option C: GitHub Gist + RawGit Alternative

1. Add the HTML file to the same gist as your JSON
2. Use a service like GitHack or jsDelivr to serve it:
   - GitHack: `https://raw.githack.com/gist/username/gistid/resources-viewer.html`

#### Option D: Local Testing

1. Simply open `resources-viewer.html` in your web browser
2. If you have the JSON file locally, it will try to load it
3. Otherwise, configure the gist URL as described above

## 🎨 Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Filters**: Filter by resource type (Books, Articles, Podcasts, etc.)
- **Statistics Dashboard**: Shows total counts, average scores, etc.
- **Sorting**: Resources automatically sorted by score
- **Modern UI**: Beautiful gradient design with hover effects
- **Fast Loading**: Efficiently loads data from GitHub gists

## 🔧 Customization

### Colors and Styling

You can modify the CSS variables at the top of the `<style>` section to change colors, fonts, and layout.

### Data Structure

The viewer expects JSON data with this structure:

```json
[
  {
    "type": "Book",
    "title": "Resource Title",
    "source": "https://example.com",
    "score": 95,
    "weeks_on_list": 1
  }
]
```

### Adding New Resource Types

New resource types will automatically get their own filter button and color coding.

## 🔄 Updating Data

Simply update your gist with new JSON data - the webpage will automatically show the latest version!

## 🛠️ Advanced Configuration

### Using GitHub API Instead of Raw URLs

For more control, you can use the GitHub API:

```javascript
const GIST_CONFIG = {
  apiUrl: "https://api.github.com/gists/your-gist-id",
  filename: "resources.json",
};
```

### CORS Considerations

- Raw gist URLs work from anywhere (no CORS issues)
- GitHub API has rate limits but provides more metadata
- For production use, consider caching the data

## 📱 Mobile Optimization

The viewer is fully responsive and includes:

- Responsive grid layout
- Touch-friendly buttons
- Optimized typography for small screens
- Horizontal scroll for filter buttons on mobile

Enjoy your beautiful AI resources webpage! 🎉
