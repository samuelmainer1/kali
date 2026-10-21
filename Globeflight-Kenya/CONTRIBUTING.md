# 🤝 Contributing to Globeflight Kenya

Thank you for your interest in contributing to the Globeflight Kenya website!

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Globeflight-Kenya.git`
3. Install dependencies: `npm install`
4. Create environment file: `cp .env.example .env`
5. Start development: `npm run dev`

## 📝 Code Standards

### JavaScript/React
- Use functional components with hooks
- Follow naming conventions (PascalCase for components)
- Use destructuring for props
- Write meaningful commit messages

### CSS/Tailwind
- Use Tailwind utility classes
- Implement responsive design
- Use semantic color classes
- Avoid hardcoded colors

### File Organization
```
components/
├── MyComponent/
│   ├── index.jsx
│   └── MyComponent.test.jsx

pages/
├── Home/
│   ├── index.jsx
│   └── sections/
```

## 🔄 Development Workflow

### Branch Naming
```bash
feature/user-authentication
fix/navbar-mobile-issue
docs/api-documentation
hotfix/security-patch
```

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```bash
feat: add user authentication system
fix(contact): resolve form validation error
docs: update README with new features
```

## 🧪 Testing

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage
```

### Writing Tests
```jsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 🔄 Pull Request Process

### Before Submitting
1. Run linting: `npm run lint`
2. Format code: `npm run format`
3. Run tests: `npm test`
4. Build project: `npm run build`

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design works
- [ ] Accessibility standards met

## 🐛 Reporting Issues

### Bug Report Template
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected vs Actual
What you expected vs what happened

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 120]
- Device: [e.g. Desktop]
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Problem
Is your feature request related to a problem?

## Solution
A clear description of what you want to happen.

## Use Cases
Why is this feature needed?
```

## 📚 Resources

- [React Documentation](https://reactjs.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

Thank you for contributing! 🚀 