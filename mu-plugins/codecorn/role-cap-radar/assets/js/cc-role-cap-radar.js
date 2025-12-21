// @ts-nocheck
// CC Role Cap Radar JS

(function ($) {
    if (!window.CC_ROLE_CAP_RADAR_DATA) return;

    const { roles, allCaps, currentUser, ajax } = CC_ROLE_CAP_RADAR_DATA;

    // UI base
    const overlay = $(`
        <div id="cc-role-cap-radar-overlay">
            <div class="cc-role-cap-radar-modal">
                <header class="cc-radar-header">
                    <div class="cc-radar-header-left">
                        <strong>Role Capability Radar</strong>
                        <span class="cc-radar-sub">
                            Gestione capability per ruolo
                        </span>
                    </div>

                    <div class="cc-radar-header-right">
                        <select id="cc-role-select"></select>
                        <button class="cc-close" aria-label="Close">✕</button>
                    </div>
                </header>

                <div class="cc-radar-body">
                    <table id="cc-cap-table">
                        <thead>
                            <tr>
                                <th>Capability</th>
                                <th>Enabled</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    `).appendTo('body');

    // Floating button
    $('<button id="cc-role-cap-radar-btn">🔐 CAPS</button>')
        .appendTo('body')
        .on('click', () => overlay.addClass('open'));

    overlay.find('.cc-close').on('click', () => overlay.removeClass('open'));

    // Populate roles select
    Object.keys(roles).forEach((slug) => {
        $('#cc-role-select').append(`<option value="${slug}">${roles[slug].name}</option>`);
    });

    // Render table
    function render_legacy(role) {
        const caps = roles[role].capabilities || {};
        const tbody = $('#cc-cap-table tbody').empty();

        allCaps.forEach((cap) => {
            const enabled = !!caps[cap];
            const disabled = !currentUser.isAdmin;
            const row = $(`
                <tr class="${enabled ? 'cap-enabled' : 'cap-disabled'}">
                    <td>${cap}</td>
                    <td>
                        <input type="checkbox" ${enabled ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
                    </td>
                </tr>
            `);

            row.find('input').on('change', function () {
                const checked = this.checked;

                // update UI immediata
                row.toggleClass('cap-enabled', checked).toggleClass('cap-disabled', !checked);

                // chiamata AJAX
                $.post(ajax.url, {
                    action: 'cc_role_cap_toggle',
                    nonce: ajax.nonce,
                    role,
                    cap,
                    value: checked,
                });
            });

            tbody.append(row);
        });
    }

    let capTable = null;

    function render(role) {
        const caps = roles[role].capabilities || {};
        const tbody = $('#cc-cap-table tbody');

        // Destroy DataTable se esiste
        if (capTable) {
            capTable.destroy();
            capTable = null;
        }

        tbody.empty();

        allCaps.forEach((cap) => {
            const enabled = !!caps[cap];
            const disabled = !currentUser.isAdmin;

            const row = $(`
            <tr class="${enabled ? 'cap-enabled' : 'cap-disabled'}">
                <td>${cap}</td>
                <td>
                    <input type="checkbox" ${enabled ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
                </td>
            </tr>
        `);

            row.find('input').on('change', function () {
                const checked = this.checked;

                row.toggleClass('cap-enabled', checked).toggleClass('cap-disabled', !checked);

                $.post(ajax.url, {
                    action: 'cc_role_cap_toggle',
                    nonce: ajax.nonce,
                    role,
                    cap,
                    value: checked,
                });
            });

            tbody.append(row);
        });

        // Init DataTable
        capTable = new DataTable('#cc-cap-table', {
            paging: true,
            searching: true,
            info: true,
            pageLength: 25,
            lengthMenu: [10, 25, 50, 100],
            order: [[0, 'asc']],
            //autoWidth: false,
            language: {
                search: 'Filtra:',
                lengthMenu: 'Mostra _MENU_',
                info: 'Mostrati _START_-_END_ di _TOTAL_',
                paginate: {
                    first: '«',
                    last: '»',
                    next: '>',
                    previous: '<',
                },
            },
        });
    }

    $(function () {
        const $roleSelect = $('#cc-role-select');

        $roleSelect
            .on('change', function () {
                render(this.value);
            })
            .trigger('change');

        // trigger ritardato e sicuro
        if ($roleSelect.length) {
            render($roleSelect.val());
        }
    });
})(jQuery);
