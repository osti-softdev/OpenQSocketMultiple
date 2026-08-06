using System;
using System.Drawing;
using System.Windows.Forms;

namespace CallerApp
{
    public class VoidModal : Form
    {
        private ComboBox cmbReason;
        private TextBox txtNotes;
        private Button btnConfirm;
        private Button btnCancel;

        public string Reason { get; private set; }
        public string Notes { get; private set; }

        public VoidModal()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Void Ticket";
            this.TopMost = AppSettings.AlwaysOnTop;
            this.Size = new Size(350, 270);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblReason = new Label() { Text = "Reason:", Location = new Point(30, 20), Size = new Size(100, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            cmbReason = new ComboBox() { Location = new Point(30, 45), Size = new Size(270, 25), DropDownStyle = ComboBoxStyle.DropDownList, Font = new Font("Segoe UI", 10) };
            cmbReason.Items.AddRange(new string[] { "No Show", "Incomplete", "Customer Cancelled", "Wrong Service", "Other" });
            cmbReason.SelectedIndex = 0;

            Label lblNotes = new Label() { Text = "Notes:", Location = new Point(30, 80), Size = new Size(100, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            txtNotes = new TextBox() { Location = new Point(30, 105), Size = new Size(270, 60), Multiline = true, Font = new Font("Segoe UI", 10), BorderStyle = BorderStyle.FixedSingle };

            btnConfirm = new Button() { 
                Text = "❌ Void Ticket", 
                Location = new Point(30, 180), 
                Size = new Size(130, 35), 
                BackColor = Color.FromArgb(231, 76, 60), 
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnConfirm.FlatAppearance.BorderSize = 0;
            btnConfirm.Click += BtnConfirm_Click;
            
            btnCancel = new Button() { 
                Text = "Cancel", 
                Location = new Point(170, 180), 
                Size = new Size(130, 35), 
                BackColor = Color.WhiteSmoke, 
                ForeColor = Color.DimGray,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };

            this.Controls.Add(lblReason);
            this.Controls.Add(cmbReason);
            this.Controls.Add(lblNotes);
            this.Controls.Add(txtNotes);
            this.Controls.Add(btnConfirm);
            this.Controls.Add(btnCancel);
        }

        private void BtnConfirm_Click(object sender, EventArgs e)
        {
            Reason = cmbReason.SelectedItem.ToString();
            Notes = txtNotes.Text;

            this.DialogResult = DialogResult.OK;
            this.Close();
        }
    }
}
