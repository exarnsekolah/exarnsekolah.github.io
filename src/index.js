// This is the main JavaScript entry point for the application.
// It initializes the application and may include logic to manipulate the DOM or handle events.
import './styles/style.css';

document.addEventListener('DOMContentLoaded', () => {
    const app = document.createElement('div');
    app.innerHTML = '<h1>Welcome to the Webpack Web Project!</h1>';
    document.body.appendChild(app);
});