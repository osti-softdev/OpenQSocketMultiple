using System;
using System.Windows.Forms;

namespace CallerApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
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
