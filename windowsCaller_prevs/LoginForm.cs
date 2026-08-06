using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

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
                chkRemember.Checked = true;
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
            lblError.Text = "";
            btnLogin.Enabled = false;
            btnLogin.Text = "⏳ Logging in...";

            var data = new { username = txtUsername.Text, password = txtPassword.Text };
            var response = ApiClient.Post("/api/login", data);

            if (response.ContainsKey("success") && (bool)response["success"])
            {
                if (chkRemember != null && chkRemember.Checked)
                {
                    AppSettings.SavedUsername = txtUsername.Text;
                    AppSettings.SavedPassword = txtPassword.Text;
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
                lblError.Text = response.ContainsKey("message") ? response["message"].ToString() : "Login failed.";
                btnLogin.Enabled = true;
                btnLogin.Text = "🔒 Login";
            }
        }
    }
}
