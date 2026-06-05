// Ticket History Module for Admin Panel

// & ===== TICKET HISTORY =====
function loadTicketHistory(search = '') {
    $.get('/api/admin/tickets/all', { search, limit: 100 }, function(tickets) {
        const $list = $('#history-list').empty();
        
        if (tickets.length === 0) {
            $list.append('<tr><td colspan="9" style="text-align:center">No tickets found</td></tr>');
            return;
        }
        
        tickets.forEach(t => {
            const duration = t.duration_minutes ? Math.round(t.duration_minutes) + ' min' : '-';
            const details = [];
            if (t.recall_count > 0) details.push(`Recalled ${t.recall_count}x`);
            if (t.void_reason) details.push(`Void: ${t.void_reason}`);
            
            $list.append(`
                <tr>
                    <td><strong>${t.ticketservice}${t.ticketnum}</strong></td>
                    <td>${t.sname}</td>
                    <td><span class="status-badge status-${t.status}">${t.status}</span></td>
                    <td>${t.counter_user || '-'}</td>
                    <td>${t.date}</td>
                    <td>${t.start_time ? t.start_time : '-'}</td>
                    <td>${t.end_time ? t.end_time : '-'}</td>
                    <td>${duration}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-primary" onclick="viewTicketDetails(${t.id})" style="margin-left: 5px;">Journey</button>
                        </div>
                    </td>
                </tr>
            `);
        });
    }).fail(function (err) {
        console.error('Failed to load ticket history:', err);
        showMsg('error', 'Unable to load ticket history.');
    });
}

// & ===== View Ticket History =====
window.viewTicketDetails = function (id) {
    $.get(`/api/admin/tickets/details/${id}`, function (data) {
        const $timeline = $('#ticket-journey-timeline');
        $timeline.empty();

        if (!data.timeline || data.timeline.length === 0) {
            $timeline.html('<p>No history available.</p>');
        } else {
            data.timeline.forEach(event => {

                const isInserted = event.event && event.event.toLowerCase().includes('inserted');
                const isVoided = event.event && event.event.toLowerCase().includes('void');
                const isAutofinished = event.event && event.event.toLowerCase().includes('autofinished');
                const isCalled = event.event && event.event.toLowerCase().includes('called');
                const isRecalled = event.event && event.event.toLowerCase().includes('recalled');
                const isHeld = event.event && event.event.toLowerCase().includes('held');
                const isforwarded = event.event && event.event.toLowerCase().includes('forwarded');
                
                const inserted = "Inserted 🟢";
                const finished = "Auto-finished ✅";
                const called = "Called 🔊";
                const recalled = "Recalled 🔁";
                const forwarded = "Forwarded ➡️";
                const held = "Held ✋";
                const voided = "Voided ❌";
                    if(isInserted){
                        event.event = inserted;
                    }else if(isAutofinished){
                        event.event = finished;
                    }else if(isCalled){
                        event.event = called;
                    }
                    else if(isRecalled){
                        event.event = recalled;
                    }
                    else if(isHeld){
                        event.event = held;
                    }
                    else if(isforwarded){
                        event.event = forwarded;
                    }
                    else if(isVoided){
                        event.event = voided;
                    }
                const textColor = isVoided ? '#dc3545' : 'inherit';
                const markerColor = isVoided ? '#dc3545' : '';

                $timeline.append(`
                    <div class="timeline-item">
                        <div class="timeline-marker" style="background-color: ${markerColor};"></div>
                        <div class="timeline-content">
                            <h4 style="color: ${textColor};">${event.event}</h4>
                            <span>${event.time}</span>
                            <p>
                                ${event.counter
                                    ? `${event.actor} (Counter ${event.counter})`
                                    : event.actor}
                            </p>
                        </div>
                    </div>
                `);
            });
        }

        $('#ticket-modal-overlay').show();
    }).fail(function (err) {
        console.error('Failed to load ticket details:', err);
        showMsg('error', 'Unable to load ticket details.');
    });
};

// & Ticket View history close modal
$('.close-ticket-modal').click(function() {
    $('#ticket-modal-overlay').hide();
});
