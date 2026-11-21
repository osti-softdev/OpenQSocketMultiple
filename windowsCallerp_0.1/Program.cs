using System;
using System.Windows.Forms;

namespace CallerApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            // Enforce modern TLS protocols dynamically since .NET 3.5 doesn't natively define them
            // 3072 = Tls12, 768 = Tls11
            System.Net.ServicePointManager.SecurityProtocol = (System.Net.SecurityProtocolType)3072 | (System.Net.SecurityProtocolType)768 | System.Net.SecurityProtocolType.Tls | System.Net.SecurityProtocolType.Ssl3;

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            AppSettings.Load();
            
            // Show login form first
            LoginForm loginForm = new LoginForm();
            if (loginForm.ShowDialog() == DialogResult.OK)
            {
                // If login successful, run main form
                Application.Run(new MainForm());
            }
        }
    }
}
