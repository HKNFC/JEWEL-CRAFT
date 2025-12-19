# Design Guidelines: Jewelry Cost Analysis Application

## Design Approach
**System: Material Design (Flutter-native)** - Selected for data-heavy enterprise applications requiring clear information hierarchy, consistent form patterns, and robust table components. Material Design provides the professional structure needed for complex pricing calculations and multi-step data entry.

## Core Design Principles
1. **Data Clarity First**: Prioritize readability and scanability of pricing tables and cost breakdowns
2. **Efficient Workflows**: Minimize steps for common tasks (adding stones, selecting manufacturers)
3. **Calculation Transparency**: Make cost buildup visible and traceable at every step

## Typography System
**Primary Font**: Roboto (Material Design default)
- Headings: Roboto Medium (20px-24px) for section titles
- Body Text: Roboto Regular (14px-16px) for forms and data
- Data Tables: Roboto Mono Regular (13px) for numerical values, pricing
- Labels: Roboto Medium (12px) for form labels, uppercase sparingly

## Layout & Spacing
**Spacing Units**: Use 4, 8, 16, 24, 32 (Material Design 8dp grid)
- Card padding: p-16 to p-24
- Form field spacing: mb-16
- Section gaps: gap-24 to gap-32
- Table cell padding: p-8 to p-12

**Container Strategy**:
- Max width: 1400px for main content area
- Two-column layouts for forms (label left, input right on desktop)
- Full-width tables with horizontal scroll on mobile

## Application Structure

### Navigation
**Top App Bar**: Fixed header with app title, active module indicator, user profile
**Side Navigation Drawer**: Collapsible sidebar with module access:
- Dashboard (cost overview)
- Analysis Records
- Manufacturers Management
- Stone Setting Rates
- Gemstone Price Lists

### Dashboard Layout
Grid of metric cards (2x2 on desktop, stacked on mobile):
- Total analyses this month
- Average product cost
- Recent manufacturer activity
- Quick action buttons

### Analysis Records (Primary View)
**Multi-Step Form Flow**:

Step 1 - Basic Information:
- Manufacturer selection (searchable dropdown)
- Product code (text input)
- Total grams (number input with unit label)
- Gold labor cost (toggle between $ and gold unit)

Step 2 - Additional Costs:
- Fire percentage (slider with numeric display)
- Polish amount (number input with currency)
- Certificate amount (number input with currency)

Step 3 - Stone Details:
**Dynamic Multi-Stone Table**:
- Add Stone button (Material FAB)
- Inline table rows: Stone Type | Size Range | Quantity | Auto-calculated Cost
- Delete row action
- Live cost summary panel (sticky sidebar on desktop, bottom sheet on mobile)

**Cost Breakdown Card**: Displays running total with expandable sections showing each cost component

### Data Tables (Manufacturers, Rates, Price Lists)
**Standard Table Pattern**:
- Sortable column headers
- Row actions (edit, delete icons, right-aligned)
- Pagination footer (10/25/50 rows per page)
- Search bar above table
- Add New button (Material outlined button, top-right)

**Edit Mode**: Modal dialog or slide-in panel with form fields

### Form Components
- Text fields: Outlined variant with helper text below
- Dropdowns: Material select with search for long lists
- Number inputs: Include increment/decrement buttons
- Date pickers: Material date picker dialog
- Action buttons: Contained (primary) and Outlined (secondary)
- Cancel/Back: Text buttons

## Component Specifications

**Cards**: Elevated (2dp shadow), rounded corners (4px), white background
**Buttons**: 48px height minimum for touch targets
**Input Fields**: 56px height, consistent with Material specs
**Icons**: Material Icons library exclusively
**Modals**: Center-aligned on desktop, full-screen on mobile
**Snackbars**: Bottom notification for save confirmations, errors

## Responsive Behavior
- Desktop (>960px): Two-column forms, side-by-side cards
- Tablet (600-959px): Single column with wider inputs
- Mobile (<600px): Full-width components, bottom navigation consideration

## Accessibility
- Minimum 4.5:1 contrast ratio for text
- Touch targets minimum 48x48px
- Form field labels always visible (not placeholder-based)
- Error messages below fields with red accent
- Required field indicators (asterisk)

## Data Visualization
For cost analysis summary:
- Simple horizontal bar charts showing cost component breakdown
- Use Material Design data visualization guidelines
- Keep charts minimal and functional

**No Hero Images**: This is a professional tool, not a marketing site - focus on immediate data access and functional efficiency.