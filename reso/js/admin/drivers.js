const driver = window.driver.js.driver;
const formatDate = (date) => {
		if (!date || isNaN(date)) return "";
		let month = (date.getMonth() + 1).toString().padStart(2, "0");
		let day = date.getDate().toString().padStart(2, "0");
		return `${date.getFullYear()}-${month}-${day}`;
	};
const today = new Date();

const driverObj = driver({
    showProgress: true,
    popoverClass: 'driverjs-theme',
    showButtons: ['next', 'previous'],
  steps: [
    // ! DASHBOARD STEPS
    { element: '.helpbtn', popover: { title: 'Admin Panel tutorials', description: 'Here is the window for system admin configurations . Let\'s walk you through it.', side: "bottom", align: 'start', onNextClick: () => {
            driverObj.moveNext();
        }, }},
    { element: '.adminbtns', popover: { title: 'Navigation Buttons', description: 'Buttons for Dashboard, Announcements, Advertisements, Settings.', side: "bottom", align: 'end' }},
    { element: '.adminName', popover: { title: 'Admin User', description: 'Current admin user.', side: "bottom", align: 'start' }},
    { element: '.dashboard-date-range', popover: { title: 'Dashboard Date Range', description: 'This is where you can set date range for the data you want to retrieve.', side: "bottom", align: 'center' }},
    { element: '.dashboard-exports', popover: { title: 'Export Buttons', description: 'You Can export data with charts in PDF,EXCEL,and CSV format.', side: "bottom", align: 'end' }},
    { element: '.dashboard-date-range', popover: { title: 'Displaying Existing Data', description: 'Let us try to set a Date and display sample Data', side: "bottom", align: 'center',onNextClick: () => {
        $("#startDate").val("2025-01-01");
        socket.emit("requestAdminDataforcontent2averages", { datefrom:'2025-01-01', dateto:formatDate(today) });
		socket.emit("requestAdminData", { datefrom:'2025-01-01', dateto:formatDate(today) });
		socket.emit("requestAdminDataforcontent3", { datefrom:'2025-01-01', dateto:formatDate(today) });
        socket.emit('requestAdminDataforcontent4alldata', { datefrom:'2025-01-01', dateto:formatDate(today) });
            driverObj.moveNext();
        }, }},
    { element: '.dash-content1', popover: { title: 'Services', description: 'Services total display.', side: "bottom", align: 'start' }},
    { element: '.dash-content2', popover: { title: 'Overview and Time Details', description: 'Displayed in this boxes are the total transactions in different statuses, charts and simple analytics.', side: "right-top", align: 'start' }},
    { element: '.dash-content3', popover: { title: 'Per Hour Transactions.', description: 'Displayed in this first chart is the Feedback(Line Chart) and Queueing(Bar chart) Per Hour.', align: 'start',onNextClick: () => {
	        $(".cnt3date").click();
        driverObj.moveNext();
        },  }},
   { element: '.dash-content3', popover: { title: 'Per Date Transactions.', description: 'Displayed in this 2nd chart is the Feedback(Line Chart) and Queueing(Bar chart) Per Date.', align: 'start',onNextClick: () => {
	        $(".cnt3month").click();
        driverObj.moveNext();
        },  }},
    { element: '.dash-content3', popover: { title: 'Per Month Transactions.', description: 'Displayed in this 3rd chart is the Feedback(Line Chart) and Queueing(Bar chart) Per Month.', side: "right-top", align: 'start' }},
    { element: '.dash-content4', popover: { title: 'Overall Records.', description: 'This table display the list of all transactions covered between the date range.', side: "right-top", align: 'start' }},
    
    // ! ANNOUNCEMENT STEPS
    {  popover: { title: 'Continue To Announcement Settings?', description: 'Let\'s walk you through it.', side: "bottom", align: 'start', onNextClick: () => {
        $(".admbtnsoptions[data-page='announcement']").click();
        driverObj.moveNext();
    }, }},
    { element: '.firstannmsg', popover: { title: 'Overall Records.', description: 'This table display the list of all transactions covered between the date range.', side: "right-top", align: 'start' }},



        // ! SETTINGS STEPS
    // { element: '.settaccountcreation', popover: { title: 'Admin Accounts Setting', description: 'This box will be the settings for you to create, update and delete an admin account.', side: "bottom", align: 'start', onNextClick: () => {
    //         $(".admbtnsoptions[data-page='settings']").click();
    //         driverObj.moveNext();
    //     }, }},
    // { element: '.setttellertupdate', popover: { title: 'Teller Accounts Setting', description: 'You will be able to create, update and delete Teller/Counter account, also you can update teller groups in this page.', side: "bottom", align: 'start' }},
    // { element: '.settservicesupdate', popover: { title: 'Services Setting', description: 'This is where you can update services, details, status and schedule for cut-off', side: "bottom", align: 'start' }},
    // { element: '.settaudiosetting', popover: { title: 'Audio Setting', description: 'Audio Settings for Speech Voices, Advertisements, and Display Bell ring tone', side: "top", align: 'start' }},
    // { element: '.settcolorupdate', popover: { title: 'Colors Setting', description: 'Here you can set colors of your display window', side: "top", align: 'start' }},
    // { element: '.settimagesupdate', popover: { title: 'Images Setting', description: 'In this window click first on Choose buttons then upload button in order to change or update the current Banner and Background image of the system.', side: "top", align: 'start' }},
    // { element: '.settsystemsetting', popover: { title: 'System Setting', description: 'This is where you can set your preferred system configurations.', side: "top", align: 'start' }},
    { popover: { title: 'Happy Queueing✌🥰', description: 'And that is all, go ahead and start using the application.' } }
  ]
});

	
