namespace CallerApp
{
    partial class MainForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(MainForm));
            this.btnSettings = new System.Windows.Forms.Button();
            this.lnkLogout = new System.Windows.Forms.LinkLabel();
            this.tabs = new System.Windows.Forms.TabControl();
            this.tabHome = new System.Windows.Forms.TabPage();
            this.btnAutoCall = new System.Windows.Forms.Button();
            this.pnlServicesList = new System.Windows.Forms.FlowLayoutPanel();
            this.tabWait = new System.Windows.Forms.TabPage();
            this.pnlWaitingList = new System.Windows.Forms.FlowLayoutPanel();
            this.tabHeld = new System.Windows.Forms.TabPage();
            this.pnlHeldList = new System.Windows.Forms.FlowLayoutPanel();
            this.tabRecv = new System.Windows.Forms.TabPage();
            this.pnlForwardedList = new System.Windows.Forms.FlowLayoutPanel();
            this.lblCurrentTicket = new System.Windows.Forms.Label();
            this.lblShortSname = new System.Windows.Forms.Label();
            this.lblDuration = new System.Windows.Forms.Label();
            this.btnComplete = new System.Windows.Forms.Button();
            this.btnHold = new System.Windows.Forms.Button();
            this.btnRecall = new System.Windows.Forms.Button();
            this.btnForward = new System.Windows.Forms.Button();
            this.btnVoid = new System.Windows.Forms.Button();
            this.durationTimer = new System.Windows.Forms.Timer(this.components);
            this.tabs.SuspendLayout();
            this.tabHome.SuspendLayout();
            this.tabWait.SuspendLayout();
            this.tabHeld.SuspendLayout();
            this.tabRecv.SuspendLayout();
            this.SuspendLayout();
            // 
            // btnSettings
            // 
            this.btnSettings.BackColor = System.Drawing.Color.WhiteSmoke;
            this.btnSettings.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnSettings.FlatAppearance.BorderSize = 0;
            this.btnSettings.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSettings.Font = new System.Drawing.Font("Segoe UI", 8F, System.Drawing.FontStyle.Bold);
            this.btnSettings.ForeColor = System.Drawing.Color.DimGray;
            this.btnSettings.Location = new System.Drawing.Point(5, 5);
            this.btnSettings.Name = "btnSettings";
            this.btnSettings.Size = new System.Drawing.Size(80, 20);
            this.btnSettings.TabIndex = 0;
            this.btnSettings.Text = "⚙ Settings";
            this.btnSettings.UseVisualStyleBackColor = false;
            this.btnSettings.Click += new System.EventHandler(this.BtnSettings_Click);
            // 
            // lnkLogout
            // 
            this.lnkLogout.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.lnkLogout.LinkColor = System.Drawing.Color.Crimson;
            this.lnkLogout.Location = new System.Drawing.Point(206, 2);
            this.lnkLogout.Name = "lnkLogout";
            this.lnkLogout.Size = new System.Drawing.Size(50, 20);
            this.lnkLogout.TabIndex = 1;
            this.lnkLogout.TabStop = true;
            this.lnkLogout.Text = "Logout";
            this.lnkLogout.LinkClicked += new System.Windows.Forms.LinkLabelLinkClickedEventHandler(this.BtnLogout_Click);
            // 
            // tabs
            // 
            this.tabs.Controls.Add(this.tabHome);
            this.tabs.Controls.Add(this.tabWait);
            this.tabs.Controls.Add(this.tabHeld);
            this.tabs.Controls.Add(this.tabRecv);
            this.tabs.Font = new System.Drawing.Font("Segoe UI", 8F);
            this.tabs.Location = new System.Drawing.Point(5, 25);
            this.tabs.Name = "tabs";
            this.tabs.SelectedIndex = 0;
            this.tabs.Size = new System.Drawing.Size(260, 163);
            this.tabs.TabIndex = 2;
            // 
            // tabHome
            // 
            this.tabHome.BackColor = System.Drawing.Color.White;
            this.tabHome.Controls.Add(this.btnAutoCall);
            this.tabHome.Controls.Add(this.pnlServicesList);
            this.tabHome.Location = new System.Drawing.Point(4, 22);
            this.tabHome.Name = "tabHome";
            this.tabHome.Padding = new System.Windows.Forms.Padding(3);
            this.tabHome.Size = new System.Drawing.Size(252, 137);
            this.tabHome.TabIndex = 0;
            this.tabHome.Text = "🏠 Home";
            // 
            // btnAutoCall
            // 
            this.btnAutoCall.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(52)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
            this.btnAutoCall.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnAutoCall.FlatAppearance.BorderSize = 0;
            this.btnAutoCall.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnAutoCall.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnAutoCall.ForeColor = System.Drawing.Color.White;
            this.btnAutoCall.Location = new System.Drawing.Point(7, 6);
            this.btnAutoCall.Name = "btnAutoCall";
            this.btnAutoCall.Size = new System.Drawing.Size(239, 35);
            this.btnAutoCall.TabIndex = 11;
            this.btnAutoCall.Text = "⚡ Auto Call";
            this.btnAutoCall.UseVisualStyleBackColor = false;
            this.btnAutoCall.Click += new System.EventHandler(this.BtnAutoCall_Click);
            // 
            // pnlServicesList
            // 
            this.pnlServicesList.AutoScroll = true;
            this.pnlServicesList.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.pnlServicesList.Location = new System.Drawing.Point(6, 45);
            this.pnlServicesList.Name = "pnlServicesList";
            this.pnlServicesList.Size = new System.Drawing.Size(240, 73);
            this.pnlServicesList.TabIndex = 12;
            this.pnlServicesList.WrapContents = false;
            // 
            // tabWait
            // 
            this.tabWait.BackColor = System.Drawing.Color.White;
            this.tabWait.Controls.Add(this.pnlWaitingList);
            this.tabWait.Location = new System.Drawing.Point(4, 22);
            this.tabWait.Name = "tabWait";
            this.tabWait.Padding = new System.Windows.Forms.Padding(3);
            this.tabWait.Size = new System.Drawing.Size(252, 180);
            this.tabWait.TabIndex = 1;
            this.tabWait.Text = "🕒 Wait";
            // 
            // pnlWaitingList
            // 
            this.pnlWaitingList.AutoScroll = true;
            this.pnlWaitingList.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnlWaitingList.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.pnlWaitingList.Location = new System.Drawing.Point(3, 3);
            this.pnlWaitingList.Name = "pnlWaitingList";
            this.pnlWaitingList.Size = new System.Drawing.Size(246, 174);
            this.pnlWaitingList.TabIndex = 0;
            this.pnlWaitingList.WrapContents = false;
            // 
            // tabHeld
            // 
            this.tabHeld.BackColor = System.Drawing.Color.White;
            this.tabHeld.Controls.Add(this.pnlHeldList);
            this.tabHeld.Location = new System.Drawing.Point(4, 22);
            this.tabHeld.Name = "tabHeld";
            this.tabHeld.Padding = new System.Windows.Forms.Padding(3);
            this.tabHeld.Size = new System.Drawing.Size(252, 180);
            this.tabHeld.TabIndex = 2;
            this.tabHeld.Text = "⏸ Held";
            // 
            // pnlHeldList
            // 
            this.pnlHeldList.AutoScroll = true;
            this.pnlHeldList.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnlHeldList.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.pnlHeldList.Location = new System.Drawing.Point(3, 3);
            this.pnlHeldList.Name = "pnlHeldList";
            this.pnlHeldList.Size = new System.Drawing.Size(246, 174);
            this.pnlHeldList.TabIndex = 0;
            this.pnlHeldList.WrapContents = false;
            // 
            // tabRecv
            // 
            this.tabRecv.BackColor = System.Drawing.Color.White;
            this.tabRecv.Controls.Add(this.pnlForwardedList);
            this.tabRecv.Location = new System.Drawing.Point(4, 22);
            this.tabRecv.Name = "tabRecv";
            this.tabRecv.Padding = new System.Windows.Forms.Padding(3);
            this.tabRecv.Size = new System.Drawing.Size(252, 180);
            this.tabRecv.TabIndex = 3;
            this.tabRecv.Text = "📩 Recv";
            // 
            // pnlForwardedList
            // 
            this.pnlForwardedList.AutoScroll = true;
            this.pnlForwardedList.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnlForwardedList.FlowDirection = System.Windows.Forms.FlowDirection.TopDown;
            this.pnlForwardedList.Location = new System.Drawing.Point(3, 3);
            this.pnlForwardedList.Name = "pnlForwardedList";
            this.pnlForwardedList.Size = new System.Drawing.Size(246, 174);
            this.pnlForwardedList.TabIndex = 0;
            this.pnlForwardedList.WrapContents = false;
            // 
            // lblCurrentTicket
            // 
            this.lblCurrentTicket.Font = new System.Drawing.Font("Segoe UI", 20F, System.Drawing.FontStyle.Bold);
            this.lblCurrentTicket.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(41)))), ((int)(((byte)(128)))), ((int)(((byte)(185)))));
            this.lblCurrentTicket.Location = new System.Drawing.Point(130, 187);
            this.lblCurrentTicket.Name = "lblCurrentTicket";
            this.lblCurrentTicket.Size = new System.Drawing.Size(120, 35);
            this.lblCurrentTicket.TabIndex = 0;
            this.lblCurrentTicket.Text = "Ready";
            this.lblCurrentTicket.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // lblShortSname
            // 
            this.lblShortSname.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.lblShortSname.ForeColor = System.Drawing.Color.Gray;
            this.lblShortSname.Location = new System.Drawing.Point(12, 187);
            this.lblShortSname.Name = "lblShortSname";
            this.lblShortSname.Size = new System.Drawing.Size(98, 20);
            this.lblShortSname.TabIndex = 7;
            this.lblShortSname.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // lblDuration
            // 
            this.lblDuration.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.lblDuration.ForeColor = System.Drawing.Color.DimGray;
            this.lblDuration.Location = new System.Drawing.Point(12, 207);
            this.lblDuration.Name = "lblDuration";
            this.lblDuration.Size = new System.Drawing.Size(98, 20);
            this.lblDuration.TabIndex = 1;
            this.lblDuration.Text = "00:00";
            this.lblDuration.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // btnComplete
            // 
            this.btnComplete.BackColor = System.Drawing.Color.Lime;
            this.btnComplete.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("btnComplete.BackgroundImage")));
            this.btnComplete.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.btnComplete.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnComplete.FlatAppearance.BorderSize = 0;
            this.btnComplete.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnComplete.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnComplete.ForeColor = System.Drawing.Color.Transparent;
            this.btnComplete.Location = new System.Drawing.Point(222, 230);
            this.btnComplete.Name = "btnComplete";
            this.btnComplete.Size = new System.Drawing.Size(33, 30);
            this.btnComplete.TabIndex = 2;
            this.btnComplete.UseVisualStyleBackColor = false;
            this.btnComplete.Click += new System.EventHandler(this.BtnComplete_Click);
            // 
            // btnHold
            // 
            this.btnHold.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(241)))), ((int)(((byte)(196)))), ((int)(((byte)(15)))));
            this.btnHold.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("btnHold.BackgroundImage")));
            this.btnHold.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.btnHold.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnHold.FlatAppearance.BorderSize = 0;
            this.btnHold.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnHold.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnHold.ForeColor = System.Drawing.Color.White;
            this.btnHold.Location = new System.Drawing.Point(172, 230);
            this.btnHold.Name = "btnHold";
            this.btnHold.Size = new System.Drawing.Size(33, 30);
            this.btnHold.TabIndex = 3;
            this.btnHold.UseVisualStyleBackColor = false;
            this.btnHold.Click += new System.EventHandler(this.BtnHold_Click);
            // 
            // btnRecall
            // 
            this.btnRecall.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(52)))), ((int)(((byte)(152)))), ((int)(((byte)(219)))));
            this.btnRecall.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("btnRecall.BackgroundImage")));
            this.btnRecall.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.btnRecall.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnRecall.FlatAppearance.BorderSize = 0;
            this.btnRecall.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnRecall.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnRecall.ForeColor = System.Drawing.Color.White;
            this.btnRecall.Location = new System.Drawing.Point(16, 230);
            this.btnRecall.Name = "btnRecall";
            this.btnRecall.Size = new System.Drawing.Size(33, 30);
            this.btnRecall.TabIndex = 4;
            this.btnRecall.UseVisualStyleBackColor = false;
            this.btnRecall.Click += new System.EventHandler(this.BtnRecall_Click);
            // 
            // btnForward
            // 
            this.btnForward.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(149)))), ((int)(((byte)(165)))), ((int)(((byte)(166)))));
            this.btnForward.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("btnForward.BackgroundImage")));
            this.btnForward.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.btnForward.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnForward.FlatAppearance.BorderSize = 0;
            this.btnForward.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnForward.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnForward.ForeColor = System.Drawing.Color.White;
            this.btnForward.Location = new System.Drawing.Point(119, 230);
            this.btnForward.Name = "btnForward";
            this.btnForward.Size = new System.Drawing.Size(33, 30);
            this.btnForward.TabIndex = 5;
            this.btnForward.UseVisualStyleBackColor = false;
            this.btnForward.Click += new System.EventHandler(this.BtnForward_Click);
            // 
            // btnVoid
            // 
            this.btnVoid.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(231)))), ((int)(((byte)(76)))), ((int)(((byte)(60)))));
            this.btnVoid.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("btnVoid.BackgroundImage")));
            this.btnVoid.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.btnVoid.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnVoid.FlatAppearance.BorderSize = 0;
            this.btnVoid.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnVoid.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btnVoid.ForeColor = System.Drawing.Color.White;
            this.btnVoid.Location = new System.Drawing.Point(67, 230);
            this.btnVoid.Name = "btnVoid";
            this.btnVoid.Size = new System.Drawing.Size(33, 30);
            this.btnVoid.TabIndex = 6;
            this.btnVoid.UseVisualStyleBackColor = false;
            this.btnVoid.Click += new System.EventHandler(this.BtnVoid_Click);
            // 
            // durationTimer
            // 
            this.durationTimer.Interval = 1000;
            this.durationTimer.Tick += new System.EventHandler(this.DurationTimer_Tick);
            // 
            // MainForm
            // 
            this.BackColor = System.Drawing.Color.White;
            this.ClientSize = new System.Drawing.Size(268, 265);
            this.Controls.Add(this.lblCurrentTicket);
            this.Controls.Add(this.lblShortSname);
            this.Controls.Add(this.lblDuration);
            this.Controls.Add(this.btnComplete);
            this.Controls.Add(this.btnHold);
            this.Controls.Add(this.btnRecall);
            this.Controls.Add(this.btnForward);
            this.Controls.Add(this.btnVoid);
            this.Controls.Add(this.tabs);
            this.Controls.Add(this.lnkLogout);
            this.Controls.Add(this.btnSettings);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.MaximizeBox = false;
            this.Name = "MainForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "___";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.MainForm_FormClosing);
            this.Load += new System.EventHandler(this.MainForm_Load);
            this.tabs.ResumeLayout(false);
            this.tabHome.ResumeLayout(false);
            this.tabWait.ResumeLayout(false);
            this.tabHeld.ResumeLayout(false);
            this.tabRecv.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button btnSettings;
        private System.Windows.Forms.LinkLabel lnkLogout;
        private System.Windows.Forms.TabControl tabs;
        private System.Windows.Forms.TabPage tabHome;
        private System.Windows.Forms.TabPage tabWait;
        private System.Windows.Forms.TabPage tabHeld;
        private System.Windows.Forms.TabPage tabRecv;
        private System.Windows.Forms.Label lblCurrentTicket;
        private System.Windows.Forms.Label lblShortSname;
        private System.Windows.Forms.Label lblDuration;
        private System.Windows.Forms.Button btnComplete;
        private System.Windows.Forms.Button btnHold;
        private System.Windows.Forms.Button btnRecall;
        private System.Windows.Forms.Button btnForward;
        private System.Windows.Forms.Button btnVoid;
        private System.Windows.Forms.Button btnAutoCall;
        private System.Windows.Forms.FlowLayoutPanel pnlServicesList;
        private System.Windows.Forms.FlowLayoutPanel pnlWaitingList;
        private System.Windows.Forms.FlowLayoutPanel pnlHeldList;
        private System.Windows.Forms.FlowLayoutPanel pnlForwardedList;
        private System.Windows.Forms.Timer durationTimer;
    }
}
