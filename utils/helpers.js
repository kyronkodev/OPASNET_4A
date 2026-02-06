const moment = require('moment');

module.exports = {
    // 날짜 포맷팅
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '-';
        return moment(date).format(format);
    },

    // 날짜+시간 포맷팅
    formatDateTime(date) {
        if (!date) return '-';
        return moment(date).format('YYYY-MM-DD HH:mm');
    },

    // 페이지네이션 계산
    getPagination(totalCount, page, limit = 20) {
        const totalPages = Math.ceil(totalCount / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const offset = (currentPage - 1) * limit;

        // 페이지 그룹 (10개씩)
        const pageGroup = Math.ceil(currentPage / 10);
        const startPage = (pageGroup - 1) * 10 + 1;
        const endPage = Math.min(pageGroup * 10, totalPages);

        return {
            totalCount,
            totalPages,
            currentPage,
            offset,
            limit,
            startPage,
            endPage,
            hasPrev: startPage > 1,
            hasNext: endPage < totalPages
        };
    },

    // 장비 상태 한글 변환
    getStatusLabel(status) {
        const labels = {
            'available': '사용가능',
            'rented': '대여중',
            'reserved': '예약중'
        };
        return labels[status] || status;
    },

    // 장비 상태 배지 클래스
    getStatusBadgeClass(status) {
        const classes = {
            'available': 'badge-available',
            'rented': 'badge-rented',
            'reserved': 'badge-reserved'
        };
        return classes[status] || 'badge-available';
    },

    // 대여 액션 배지 클래스
    getActionBadgeClass(action) {
        const classes = {
            'rent': 'badge-rent',
            'return': 'badge-return',
            'reserve': 'badge-reserve'
        };
        return classes[action] || 'badge-rent';
    },

    // 대여 액션 한글 변환
    getActionLabel(action) {
        const labels = {
            'rent': '대여',
            'return': '반납',
            'reserve': '예약'
        };
        return labels[action] || action;
    }
};
