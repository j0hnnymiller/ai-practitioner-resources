# Development Notes

## Test Data Files

- `test-local.json` - Local test data for development. Switch the URL in `index.html` to use this for local testing.
- `/tmp/` directory - Contains runtime automation outputs (created automatically during workflow execution)

## Archive Directory

The `archive/` directory contains:

- Historical documentation from the development process
- Legacy GitHub issue creation scripts (no longer used)
- Analysis and testing scripts used during development
- Test data from development iterations

## Production Configuration

The main `index.html` is configured to use the production GitHub Gist URL by default.

## Development Workflow

To test locally:

1. Ensure `test-local.json` has valid test data
2. Update the URL in `index.html` GIST_CONFIG to point to `"./test-local.json"`
3. Run a local server: `python -m http.server 8080`
4. Access at `http://localhost:8080`
5. Remember to switch back to production URL before committing
