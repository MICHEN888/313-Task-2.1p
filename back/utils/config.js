const env = process.env.NODE_ENV || 'development';

const configs = {
  development: {
    port: 3000,
    db: 'mongodb://localhost:27017',
    db_name: "cxk_demo",
    db_collection: {
      users: "cxk_demo_one",
      posts: "forum_posts"
    },
    sendgrid_api_key: "5bdc464e0ba37ea690f9133d1ed1dd8d-us11",
    email_from: "chennyyyy5@gmail.com",
    email_name: "Dev Deakin MI CHEN"
  }
};
// 842816 k2._domainkey.163.com dkim2.mcsv.net k3._domainkey.163.com dkim3.mcsv.net _dmarc v=DMARC1; p=none;

module.exports = configs[env];