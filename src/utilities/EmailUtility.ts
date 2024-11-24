import * as nodemailer from "nodemailer";

export async function SendEmailWithAttachment(email:string, subject:string, body:string, attachmentName: string, attachmentPath: string) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_KEY
        }
      });
      
    const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: body,
        attachments:[
            {
                filename:`${attachmentName}_${getDateString()}.pdf`,
                path: attachmentPath
            }
        ]
      }).catch(console.error);
      console.log(`Email sent to ${email}`);
      return info ? info.messageId : null;
}

function getDateString(): string{
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const day = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}