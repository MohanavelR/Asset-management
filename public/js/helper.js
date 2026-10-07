// ========= Table Messages=========================
function dataTableMessages(item = "records", icon = "fa-solid fa-folder-open") {
    return {
        loadingRecords: "&nbsp;",
        // processing: `
        //     <div class="py-3 text-center">
        //         <div class="spinner-border app-text-primary" role="status"></div>
        //         <div class="mt-2 app-text-tertiary">
        //             Loading ${item}...
        //         </div>
        //     </div>
        // `,
        emptyTable: `
            <div class="py-4 text-center app-text-tertiary">
                <i class="${icon} fs-3 mb-2"></i>
                <div>No ${item} found</div>
            </div>
        `,
        zeroRecords: `
            <div class="py-4 text-center app-text-tertiary">
                <i class="fa-solid fa-magnifying-glass fs-3 mb-2"></i>
                <div>No matching ${item} found</div>
            </div>
        `
    };
}

// ================== Status Render=================
function getStatusColor(status) {
    const colors = {
        Active: "app-bg-success",
        Inactive: "app-bg-secondary"
    };
    return colors[status] || "app-bg-secondary";
}

function renderStatus(status) {
    return `
        <span class="badge ${getStatusColor(status)}">
            ${status}
        </span>
    `;
}


// ============= Render Action======================

function buildActions(data, actions = []) {
    const $wrap = $('<div class="d-flex gap-1"></div>');

    actions.forEach(a => {
        const cls = `btn btn-sm ${a.class || "btn-outline-secondary"}`;
        let $el;

        if (a.type === "url") {
            $el = $("<a>", {
                href: a.url || "#",
                class: cls,
                title: a.title || ""
            });
        }

        else if (a.type === "button") {
            $el = $("<button>", {
                type: "button",
                class: cls,
                title: a.title || ""
            }).on("click", () => {
                if (typeof a.action === "function") {
                    a.action(data);
                }
            });
        }

        else {
            return;
        }

        if (a.icon) {
            $el.append($("<i>", {
                class: a.icon
            }));
        }

        $wrap.append($el);
    });

    return $wrap;
}

function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function createReload(table, delay = 300) {
    return debounce(function () {
        table.ajax.reload();
    }, delay);
}


function showApiError(res_data) {
  if (Array.isArray(res_data.errors) && res_data.errors.length) {
    showToasts(res_data.errors.map(e => e.message));
  } else {
    showToast(res_data.message || "Something went wrong", "danger");
  }
}