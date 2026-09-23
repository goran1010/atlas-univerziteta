import { env } from "../config/env.js";

function emailConfirmHTML() {
  return `    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Email Confirmed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
          }
          h1 {
            color: #4CAF50;
          }
          a {
            color: #4CAF50;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <h1>Your email has been confirmed!</h1>
        <p>You can now close this window and <a href="${env.WEBAPP_URL}/login">log in</a> to your account.</p>
      </body>
    </html>
   `;
}

// confirmation links are opened in a browser, so failures must be readable
// pages too, not JSON
function emailConfirmErrorHTML(message: string) {
  return `    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Email Confirmation Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
          }
          h1 {
            color: #c62828;
          }
          a {
            color: #4CAF50;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <h1>Email confirmation failed</h1>
        <p>${message}</p>
        <p><a href="${env.WEBAPP_URL}/signup">Sign up again</a> or <a href="${env.WEBAPP_URL}/login">log in</a>.</p>
      </body>
    </html>
   `;
}

export { emailConfirmHTML, emailConfirmErrorHTML };
