---
name: windows-app-design
description: Design patterns and best practices for modern Windows desktop apps following Fluent Design System
---

## Core Principles

Follow Microsoft's Fluent Design System for a modern Windows experience.

## Layout & Geometry

- Use grid-based layouts with consistent spacing (4px baseline grid)
- Apply proper alignment - every element aligns intentionally
- Account for safe areas and notches
- Support different window sizes with responsive layouts

## Visual Design

- **Color**: Establish hierarchy, communicate meaning, create cohesive identity
- **Typography**: Use Segoe UI Variable with consistent type hierarchy
- **Elevation**: Apply depth/layering to guide focus (Mica, Acrylic materials)
- **Iconography**: Use Fluent UI System Icons (filled/outlined variants)

## Interactions

- All interactions keyboard-operable with visible focus rings
- Minimum touch target: 44x44px (24x24px for desktop)
- Loading states: show spinner with 150-300ms delay, minimum 300ms visible
- Confirm destructive actions, provide Undo capability

## Navigation

- Predictable, well-structured navigation patterns
- Support keyboard navigation (Tab, Arrow keys, Alt+Tab)
- Deep-link everything (filters, tabs, expanded panels)

## Accessibility

- Follow WCAG 2.1 AA minimum contrast ratios
- All images have alt text
- Support screen readers with proper ARIA labels
- Respect `prefers-reduced-motion`

## Performance

- Fast startup and response times
- Efficient memory usage
- Lazy-load off-screen content
- Profile with realistic data (CPU/network throttling)

## Windows-Specific

- Use WinUI 3 or Windows App SDK for native look
- Support light/dark theme with system preference detection
- Implement proper window management (min/max/close, snap layouts)
- Use Mica material for background to match system

## Modern Patterns

- Layered shadows mimicking ambient + direct light
- Crisp borders combining borders and shadows
- Nested radii (child radius <= parent radius)
- Interactions increase contrast on hover/active/focus
