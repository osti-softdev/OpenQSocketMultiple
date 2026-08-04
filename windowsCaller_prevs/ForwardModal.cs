using System;
using System.Drawing;
using System.Windows.Forms;
using System.Collections.Generic;

namespace CallerApp
{
    public class ForwardModal : Form
    {
        private ComboBox cmbTargetType;
        private ComboBox cmbTeller;
        private ComboBox cmbGroup;
        private TextBox txtNote;
        private Button btnConfirm;
        private Button btnCancel;

        public string SelectedTargetType { get; private set; }
        public string SelectedTellerId { get; private set; }
        public string SelectedGroupId { get; private set; }
        public string Note { get; private set; }

        public ForwardModal(object[] tellers, object[] groups)
        {
            InitializeComponent(tellers, groups);
        }

        private void InitializeComponent(object[] tellers, object[] groups)
        {
            this.Text = "Forward Ticket";
            this.Size = new Size(350, 320);
            this.StartPosition = FormStartPosition.CenterParent;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.BackColor = Color.White;

            Label lblType = new Label() { Text = "Forward To:", Location = new Point(30, 20), Size = new Size(100, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            cmbTargetType = new ComboBox() { Location = new Point(30, 45), Size = new Size(270, 25), DropDownStyle = ComboBoxStyle.DropDownList, Font = new Font("Segoe UI", 10) };
            cmbTargetType.Items.Add("Specific Teller");
            cmbTargetType.Items.Add("Teller Group");
            cmbTargetType.SelectedIndex = 0;
            cmbTargetType.SelectedIndexChanged += CmbTargetType_SelectedIndexChanged;

            Label lblTeller = new Label() { Text = "Select Teller:", Location = new Point(30, 80), Size = new Size(100, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            cmbTeller = new ComboBox() { Location = new Point(30, 105), Size = new Size(270, 25), DropDownStyle = ComboBoxStyle.DropDownList, Font = new Font("Segoe UI", 10) };
            
            Label lblGroup = new Label() { Text = "Select Group:", Location = new Point(30, 80), Size = new Size(100, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray, Visible = false };
            cmbGroup = new ComboBox() { Location = new Point(30, 105), Size = new Size(270, 25), DropDownStyle = ComboBoxStyle.DropDownList, Font = new Font("Segoe UI", 10), Visible = false };

            if (tellers != null)
            {
                foreach (Dictionary<string, object> t in tellers)
                {
                    cmbTeller.Items.Add(new ComboItem(string.Format("{0} (Counter {1})", t["cname"], t["cnum"]), t["id"].ToString()));
                }
            }

            if (groups != null)
            {
                foreach (Dictionary<string, object> g in groups)
                {
                    cmbGroup.Items.Add(new ComboItem(g["group_name"].ToString(), g["id"].ToString()));
                }
            }

            Label lblNote = new Label() { Text = "Note:", Location = new Point(30, 140), Size = new Size(100, 20), Font = new Font("Segoe UI", 9, FontStyle.Bold), ForeColor = Color.Gray };
            txtNote = new TextBox() { Location = new Point(30, 165), Size = new Size(270, 50), Multiline = true, Font = new Font("Segoe UI", 10), BorderStyle = BorderStyle.FixedSingle };

            btnConfirm = new Button() { 
                Text = "➡️ Forward", 
                Location = new Point(30, 230), 
                Size = new Size(130, 35), 
                BackColor = Color.FromArgb(41, 128, 185), 
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnConfirm.FlatAppearance.BorderSize = 0;
            btnConfirm.Click += BtnConfirm_Click;
            
            btnCancel = new Button() { 
                Text = "Cancel", 
                Location = new Point(170, 230), 
                Size = new Size(130, 35), 
                BackColor = Color.WhiteSmoke,
                ForeColor = Color.DimGray,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => { this.DialogResult = DialogResult.Cancel; this.Close(); };

            this.Controls.Add(lblType);
            this.Controls.Add(cmbTargetType);
            this.Controls.Add(lblTeller);
            this.Controls.Add(cmbTeller);
            this.Controls.Add(lblGroup);
            this.Controls.Add(cmbGroup);
            this.Controls.Add(lblNote);
            this.Controls.Add(txtNote);
            this.Controls.Add(btnConfirm);
            this.Controls.Add(btnCancel);
        }

        private void CmbTargetType_SelectedIndexChanged(object sender, EventArgs e)
        {
            bool isTeller = cmbTargetType.SelectedIndex == 0;
            cmbTeller.Visible = isTeller;
            cmbGroup.Visible = !isTeller;
        }

        private void BtnConfirm_Click(object sender, EventArgs e)
        {
            SelectedTargetType = cmbTargetType.SelectedIndex == 0 ? "teller" : "group";
            
            if (SelectedTargetType == "teller" && cmbTeller.SelectedItem != null)
                SelectedTellerId = ((ComboItem)cmbTeller.SelectedItem).Value;
            
            if (SelectedTargetType == "group" && cmbGroup.SelectedItem != null)
                SelectedGroupId = ((ComboItem)cmbGroup.SelectedItem).Value;

            Note = txtNote.Text;

            if (string.IsNullOrEmpty(SelectedTellerId) && string.IsNullOrEmpty(SelectedGroupId))
            {
                MessageBox.Show("Please select a teller or group.", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            this.DialogResult = DialogResult.OK;
            this.Close();
        }

        private class ComboItem
        {
            private string _text;
            private string _value;

            public string Text { get { return _text; } }
            public string Value { get { return _value; } }

            public ComboItem(string text, string value)
            {
                _text = text;
                _value = value;
            }

            public override string ToString()
            {
                return _text;
            }
        }
    }
}
