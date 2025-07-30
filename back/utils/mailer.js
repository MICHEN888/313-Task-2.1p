const config = require('./config');
const mailchimp = require("@mailchimp/mailchimp_marketing");
require('dotenv').config();

mailchimp.setConfig({
  apiKey: "5bdc464e0ba37ea690f9133d1ed1dd8d-us11",
  server: "us11"
});

const LIST_ID = "443c4859e2";
// 5ca48f52cf md-B05ecE-rlG24nKCsJ3XYZg

async function safeAddToAudience(email, name) {
  try {
    try {
      await mailchimp.lists.addListMember(LIST_ID, {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: name.split(' ')[0] || name,
          LNAME: name.split(' ').slice(1).join(' ') || ''
        }
      });
      console.log(`User ${email} has been successfully added to the list`);
    } catch (addError) {
      const addErrorData = addError.response?.body || {};
      if (addErrorData.title !== "Member Exists") {
        console.error("Failed to add a user to the list", addErrorData);
        return { success: false }; 
      }
      console.log(`User ${email} is already in the list and there is no need to add it again`);
    }

    let segmentId;
    try {
      const segment = await mailchimp.lists.createSegment(LIST_ID, {
        name: `single-${Date.now()}`, 
        static_segment: [email] 
      });
      segmentId = segment.id;
      console.log(`The segment created for ${email} was successful. ID:${segmentId}`);
    } catch (segError) {
      console.error("Failed to create a static segment", segError.response?.body || segError.message);
      return { success: false };
    }

    return { success: true, segmentId };
  } catch (error) {
    console.error("Overall process error", error.message);
    return { success: false };
  }
}

exports.sendWelcomeEmail = async (toEmail, toName) => {
  if (!toEmail || !toName) {
    console.error("Missing email or name");
    return false;
  }

  const addResult = await safeAddToAudience(toEmail, toName);
  if (!addResult.success) {
    console.error("Failed to add user to audience");
    return false;
  }

  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6495ed;">Welcome to MICHEN!</h2>
        <p>Hello ${toName},</p>
        <p>Thank you for registering with MICHEN. Your account has been created successfully.</p>
        <p>We're excited to have you as part of our community!</p>
        <p>Best regards,<br>The MICHEN Team</p>

        <div style="margin-top: 30px; padding: 10px; background: #f5f5f5; font-size: 12px; color: #666;">
          <p>You are receiving this email because you subscribed to MICHEN updates.</p>
          <p>To unsubscribe: <a href="*|UNSUB|*">Click here</a></p>
          <p>Our address: 123 Example Street, City, Country, ZIP Code</p>
        </div>
      </div>
    `;

    const textContent = `
      Welcome to MICHEN!

      Hello ${toName},

      Thank you for registering with MICHEN. Your account has been created successfully.

      We're excited to have you as part of our community!

      Best regards,
      The MICHEN Team

      You are receiving this email because you subscribed to MICHEN updates.
      To unsubscribe: *|UNSUB|*
      Our address: 123 Example Street, City, Country, ZIP Code
    `;

    const campaign = await mailchimp.campaigns.create({
      type: "regular",
      recipients: {
        list_id: LIST_ID,
        segment_opts: {
          saved_segment_id: addResult.segmentId
        }
      },
      settings: {
        subject_line: `Welcome to MI CHEN, ${toName}!`,
        from_name: "MI CHEN Team",
        reply_to: config.email_from,
        to_name: toName,
        track_clicks: true,
        track_opens: true
      }
    });

    await mailchimp.campaigns.setContent(campaign.id, {
      html: htmlContent,
      text: textContent
    });

    const response = await mailchimp.campaigns.send(campaign.id);

    console.log(`Successfully sent welcome email to ${toEmail}`, response);
    return true;
  } catch (error) {
    console.log(error);
    console.error("Error sending welcome email:", error.response?.data || error.message);
    return false;
  }
};

// const mandrill = require('mandrill-api/mandrill');
// const config = require('./config');
// require('dotenv').config();

// const mandrillClient = new mandrill.Mandrill("md-B05ecE-rlG24nKCsJ3XYZg");

// exports.sendWelcomeEmail = async (toEmail, toName) => {
//   if (!toEmail || !toName) {
//     console.error("Missing email or name");
//     return false;
//   }

//   try {
//     const htmlContent = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #6495ed;">Welcome to MICHEN!</h2>
//         <p>Hello ${toName},</p>
//         <p>Thank you for registering with MICHEN. Your account has been created successfully.</p>
//         <p>We're excited to have you as part of our community!</p>
//         <p>Best regards,<br>The MICHEN Team</p>
//       </div>
//     `;

//     const textContent = `Welcome to MICHEN!\n\nHello ${toName},\n\nThank you for registering.`;

//     const message = {
//       html: htmlContent,
//       text: textContent,
//       subject: `Welcome to MI CHEN, ${toName}!`,
//       from_email: "noreply@yourdomain.com",
//       from_name: "MICHEN Team",
//       to: [{
//         email: toEmail,
//         name: toName,
//         type: "to"
//       }],
//       important: true,
//       track_opens: true,
//       track_clicks: true,
//       auto_text: true,
//       preserve_recipients: false
//     };

//     const result = await new Promise((resolve, reject) => {
//       mandrillClient.messages.send({
//         message: message,
//         async: false
//       }, resolve, reject);
//     });

//     console.log("Mandrill send result:", result);
//     return result[0]?.status === "sent";
//   } catch (error) {
//     console.error("Mandrill send error:", error.message || error);
//     return false;
//   }
// };