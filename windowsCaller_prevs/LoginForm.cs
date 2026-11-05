using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Threading;

namespace CallerApp
{
    public partial class LoginForm : Form
    {
        public LoginForm()
        {
            InitializeComponent();
            this.Load += LoginForm_Load;
        }

        private void LoginForm_Load(object sender, EventArgs e)
        {
            if (!string.IsNullOrEmpty(AppSettings.SavedUsername))
            {
                txtUsername.Text = AppSettings.SavedUsername;
                if (chkRemember != null) chkRemember.Checked = true;
            }
            if (!string.IsNullOrEmpty(AppSettings.SavedPassword))
            {
                txtPassword.Text = AppSettings.SavedPassword;
            }
        }

        private void BtnSettings_Click(object sender, EventArgs e)
        {
            using (SettingsModal sm = new SettingsModal()) {
                sm.ShowDialog();
            }
        }

        private void BtnLogin_Click(object sender, EventArgs e)
        {
            string userText = txtUsername.Text.Trim();
            string passText = txtPassword.Text;
            bool remember = chkRemember != null && chkRemember.Checked;

            if (string.IsNullOrEmpty(userText) || string.IsNullOrEmpty(passText))
            {
                lblError.Text = "Please enter username and password.";
                return;
            }

            lblError.Text = "";
            btnLogin.Enabled = false;
            btnLogin.Text = "⏳ Logging in...";

            ThreadPool.QueueUserWorkItem(delegate
            {
                var data = new { username = userText, password = passText };
                var response = ApiClient.Post("/api/login", data);

                if (this.IsDisposed || !this.IsHandleCreated) return;

                this.BeginInvoke(new Action(delegate
                {
                    if (response != null && response.ContainsKey("success") && (bool)response["success"])
                    {
                        ApiClient.SetLastCredentials(userText, passText);
                        if (remember)
                        {
                            AppSettings.SavedUsername = userText;
                            AppSettings.SavedPassword = passText;
                        }
                        else
                        {
                            AppSettings.SavedUsername = "";
                            AppSettings.SavedPassword = "";
                        }
                        AppSettings.Save();

                        ApiClient.CurrentTeller = response["teller"] as Dictionary<string, object>;
                        this.DialogResult = DialogResult.OK;
                        this.Close();
                    }
                    else
                    {
                        lblError.Text = (response != null && response.ContainsKey("message"))
                            ? response["message"].ToString()
                            : "Login failed.";
                        btnLogin.Enabled = true;
                        btnLogin.Text = "🔒 Login";
                    }
                }));
            });
        }
    }
}
