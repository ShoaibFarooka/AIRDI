export const dataSource = [
    {
        key: '1',
        time: '21 Days or More',
        lga_price: '$20',
        jfk_price: '$25',
    },
    {
        key: '2',
        time: '2 - 20 days',
        lga_price: '$25',
        jfk_price: '$30',
    },
    {
        key: '3',
        time: '48 Hours or Less',
        lga_price: '$30',
        jfk_price: '$35',
    },
];

export const columns = [
    {
        title: 'Time before departure',
        dataIndex: 'time',
        key: 'time',
    },
    {
        title: 'LGA Price',
        dataIndex: 'lga_price',
        key: 'lga_price',
    },
    {
        title: 'JFK Price',
        dataIndex: 'jfk_price',
        key: 'jfk_price',
    },
];
