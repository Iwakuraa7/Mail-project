document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Display all emails in a current mailbox
  fetch(`/emails/${mailbox}`)
      .then(response => response.json())
      .then(emails => {
          emails.forEach((email) => {
              // For each email from fetch, create div with the contents
              const emailBox = document.createElement('div')
              email.read ? emailBox.className = "emails read" : emailBox.className = "emails notRead"

              const sender = document.createElement('p')
              sender.innerHTML = email.sender
              const subject = document.createElement('p')
              subject.innerHTML = email.subject
              const timestamp = document.createElement('p')
              timestamp.innerHTML = email.timestamp

              // Load html elements to the current email
              emailBox.prepend(sender, subject, timestamp)
              document.querySelector('#emails-view').append(emailBox)

              // Add click listener for divs : load the full info of the current email into the email-view div when clicked
              emailBox.addEventListener('click', () => {
                    document.querySelector('#emails-view').style.display = 'none';

                    // Set the 'read' data-field to true
                    fetch(`/emails/${email.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            read: true
                        })
                    })
                    emailBox.className = "emails read"

                    // Create/Modify the email view
                    const emailView = document.querySelector('#email-view')
                    emailView.innerHTML = ''

                    fetch(`/emails/${email.id}`)
                        .then(response => response.json())
                        .then(email => {

                            // Add contents to the current email
                            emailView.innerHTML = `
                            <div class="from-to-info">
                                <p><strong>Sender: </strong>${email.sender}</p>
                                <p><strong>Recipients: </strong>${email.recipients}<p>
                                <p><strong>Subject: </strong>${email.subject}</p>
                                <p><strong>When: </strong>${email.timestamp}</p>
                            </div><hr>
                            <p>${email.body.replace(/\n/g, '<br>')}</p>
                            <button class="buttons" onclick="reply(${email.id})">Reply</button>
                            `;

                            // Add archive button
                            if (mailbox !== 'sent') {
                                  const archiveBtn = document.createElement('button')
                                  archiveBtn.className = 'buttons'
                                  email.archived ? archiveBtn.textContent = "UnArchive" : archiveBtn.textContent = "Archive"
                                  archiveBtn.onclick = function () {
                                      fetch(`/emails/${email.id}`, {
                                          method: "PUT",
                                          body: JSON.stringify({
                                              archived: !email.archived
                                          })
                                      }).then(() => load_mailbox('inbox'))
                                  };

                                  emailView.append(archiveBtn)
                            }

                            emailView.style.display = 'block'
                        })
              });
          });
      });
}

function send_email(event) {
    event.preventDefault();

    const recipients = document.querySelector('#compose-recipients').value
    const subject = document.querySelector('#compose-subject').value
    const body = document.querySelector('#compose-body').value

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: `${recipients}`,
        subject: `${subject}`,
        body: `${body}`
      })
    }).then(() => load_mailbox('sent'))
}

function reply(emailId) {
    compose_email();

    // Prefill the email
    fetch(`/emails/${emailId}`)
        .then(response => response.json())
        .then(email => {
              document.querySelector('#compose-recipients').value = `${email.sender}`;
              email.subject.startsWith("Re: ") ? document.querySelector('#compose-subject').value = `${email.subject}` : document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
              document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
        })
}