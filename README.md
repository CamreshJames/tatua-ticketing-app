# tatua-ticketing-app 
# Tatua Ticketing System

A comprehensive web application for managing support tickets with multiple storage options and a clean, professional interface.

## Features

- **Ticket Management**: Create, view, and delete support tickets
- **Multiple Storage Options**: 
  - In-Memory storage (temporary)
  - Session Storage (persists until tab is closed)
  - Local Storage (persists across browser sessions)
- **Form Validation**: Client-side validation with real-time feedback
- **Responsive Design**: Works on desktop and mobile devices
- **Professional UI**: Clean interface matching modern design standards

## Project Structure

```
tatua-ticketing-app/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and layout
├── app.js              # JavaScript functionality
└── README.md           # Project documentation
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tatua-ticketing-app.git
   cd tatua-ticketing-app
   ```

2. Open `index.html` in your web browser

3. Start creating tickets and testing different storage options!

## Development Process

This project was built following a feature-based branching strategy:

### Phase 1: In-Memory Storage (`part1-memory-storage` branch)
- Created basic HTML form structure
- Implemented CSS styling to match design specifications
- Added form validation and submission handling
- Built ticket display table with action buttons
- Implemented in-memory data storage using JavaScript arrays

### Phase 2: Session Storage (`part2-session-storage` branch)
- Extended storage functionality to use browser sessionStorage
- Added persistence that survives page refreshes
- Maintained data isolation per browser tab
- Updated storage management with error handling

### Phase 3: Local Storage (`part3-local-storage` branch)
- Implemented localStorage for permanent data persistence
- Added cross-session data retention
- Enhanced storage reliability with try-catch blocks
- Completed all storage strategy implementations

## Technical Implementation

### Architecture
- **Strategy Pattern**: Used for different storage implementations
- **Class-based Structure**: Clean separation of concerns
- **Event-driven Design**: Responsive user interactions
- **Modular CSS**: Organized styling with component-based approach

### Key Components

#### Storage Strategies
```javascript
class MemoryStorage    // Temporary storage in memory
class SessionStorage   // Browser session-based storage
class LocalStorage     // Persistent browser storage
```

#### Form Validation
- Real-time validation feedback
- Email format validation
- Phone number format checking
- Required field validation
- Terms and conditions agreement

#### Ticket Management
- Unique ID generation for each ticket
- Date/time stamping
- CRUD operations (Create, Read, Delete)
- Data sanitization and XSS prevention

## Usage

### Creating a Ticket
1. Fill out all required fields in the form
2. Select your preferred contact method
3. Optionally attach a file
4. Agree to terms and conditions
5. Click "Submit"

### Viewing Tickets
- All tickets are displayed in the right panel table
- Click "View" to see full ticket details
- Tickets are sorted by creation date (newest first)

### Storage Options
Use the dropdown in the top-right to switch between:
- **Memory**: Data lost on page refresh (good for testing)
- **Session**: Data persists until browser tab is closed
- **Local**: Data persists permanently until manually cleared

### Managing Tickets
- **View**: Display full ticket information in a modal
- **Edit**: Placeholder for future edit functionality
- **Delete**: Remove ticket with confirmation dialog

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- ES6+ JavaScript features
- CSS Grid and Flexbox support

## Features Demonstrated

### JavaScript Concepts
- Object-oriented programming with ES6 classes
- Array manipulation and data filtering
- Form handling and validation
- DOM manipulation and event handling
- Browser storage APIs (localStorage, sessionStorage)
- Error handling with try-catch blocks

### CSS Features
- Flexbox and CSS Grid layouts
- Custom form controls (radio buttons, checkboxes)
- Responsive design with media queries
- CSS transitions and hover effects
- Modern color schemes and typography

### HTML5 Elements
- Semantic form structure
- Input validation attributes
- File upload handling
- Accessible markup with proper labels

## Future Enhancements

- Edit ticket functionality
- Ticket status management (Open, In Progress, Closed)
- Search and filtering capabilities
- Export tickets to CSV/PDF
- Email notifications
- User authentication and roles
- Backend API integration
- Advanced file attachment handling

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Development Notes

- No external dependencies - pure HTML, CSS, and JavaScript
- Follows modern web development best practices
- Implements proper error handling and user feedback
- Uses semantic HTML and accessible design patterns
- Responsive design tested on multiple device sizes

---

**Note**: This is a frontend-only implementation. For production use, you would need to integrate with a backend API for data persistence and security.

good that was beautiful

a non color visual aid like and icon to show when the invalid input

file attachments limit to pdf and images a file preview on the ticket list

also the refresh button is at the top of the table not not in header also the nav links are on the left after submit i want user to review the submission

reset button to clear the forrm to view create a modal

encrypt the data stored in various storages 

filter show for only the in-memory branch filter

ODATA

REST

Reflection

Encrption (PKI, AES)

hashin (sha, MD5)
Making a filesstem in memory

do all things you can in a file system