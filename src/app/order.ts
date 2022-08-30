export interface Order {
    makeline_time: string;
    load_time: string;
    order_saved: string;
    order_date: string;
    tsg_min_duration: number;
    tsg_max_duration: number;
    late_min_duration: number;
    late_max_duration: number;
    late_discount: number;
    store_id: string;
    categories: any;
    serial: number;
    rider_location: string;
    last_status: string;
    id: string;
    outlet_id: string;
    order_id: string;
    prep_time: number;
    external_id: string;
    outlet: Outlet;
    user: User;
    customer_id: string;
    delivery_address_id: string;
    order_status: OrderStatus[];
    order_items: OrderItem[];
    total: number;
    branch_name: string;
    created_on: Date;
    user_id: number;
    sub_total: number;
    zone_id: string;
    zone_name: string;
    delivered_at: string;
    accepted_at: string;
    dispatched_at: string;
    scheduled_for: Date;
    estimated_travel_distance: number;
    last_touch_point_to_hub_distance: number;
    type: string;
    auto_assignment: string;
    pick_up_address_id: string;
    status_name: string;
    status_code: number;
    distance: number;
    time_taken: number;
    customer: Customer;
    pick_up_address: Address;
    delivery_address: Address;
    merchant_order: MerchantOrder;
    delivery_location: Geom;
    custom_field_order: CustomFieldOrder;
    payment_type: string;
    duty_start: Date;
    duty_end: Date;
    assignment_retry: number;
    pick_up_location: Geom;
    rider: Rider;
    selectRider: SelectRider;
    rider_position: Geom;
    touch_points: any[];
    rider_id: string;
    is_duty: boolean;
    markers: any[];
    updated_on: string;
    drop_off_distance: string;
    pick_up_distance: string;
    pick_up_eta: number;
    drop_off_eta: number;
    company_id: string;
    source: string;
    notes: string;
    is_express: boolean;
    start_odometer: {};
    end_odometer: {};
    order_category_rider: any[];
    proof_of_delivery: string;
}
export interface SelectRider {
    name: string;
    mobile_number: string;
}

export interface Rider {
    brand_id: string;
    id: string;
    employee_id: string;
    rider_id: string;
    course: number;
    current_location: Geom;
    active_orders: number;
    name: string;
    unique_id: string;
    external_id: string;
    zone: Zone;
    geofence_id: string;
    on_duty: string;
    online: string;
    status: string;
    in_zone: string;
    curr_address: string;
    battery_level: string;
    device_token: string;
    device_type: string;
    device_details: string;
    app_version: string;
    mobile_number: string;
    geom: Geom;
    speed: string;
    fixed_time: string;
    rating: string;
    field1: string;
    picture: string;
    auto_attendance: string;
    auth_id: string;
    zone_id: string;
    order: Order;
    next_order: Order;
    bluetooth_mac: string;
    type_id: string;
}
export interface Customer {
    is_active: boolean;
    id: string;
    name: string;
    auth_id: string;
    email: string;
    mobile_number: string;
    address: Address;
}
export interface Address {
    id: string;
    address: string;
    google_address: string;
    geom: Geom;
    city: string;
    state: string;
    country: string;
}

export interface Geom {
    latitude: number;
    longitude: number;
}
export interface User {
    id: string;
    name: string;
    auth_id: string;
    branches: any[];
    // password: string;
    mobile_number: string;
    report_email: string;
    email: string;
    address: Address;
    phone: any	;
    unique_id: string;
    field1: string;
    outlets: any[];
    zone_ids: any[];
    statuses?: Status[];
    permissions: any[];
}

export interface MerchantOrder {
    id: string;
    created_on: string;
    delivery_address_id: string;
    delivery_address: Address;
    outlet: Outlet;
    order_id: string;
    prep_time: number;
    delivery_address_location: Geom;
    outlet_id: string;
    delivery_location: Geom;
    customer_id: string;
    customer: Customer;
    otp: number;
}

export interface CustomFieldOrder {
    created_on: string;
    id: string;
    order_id: string;
    order: string;
    field1: string;
    field2: string;
    field3: string;
    field4: string;
    field5: string;
    field6: string;
    field7: string;
    field8: string;
    field9: string;
    field10: string;
}

export interface OrderStatus {
    order: Order;
    order_id: number;
    status_id: number;
    status_name: string;
    rider_name: string;
    user_name: string;
    status: Status;
    geom: Geom;
    user: User;
    created_on: Date;
}
export interface OrderItem {
    amount: number;
    name: string;
    notes: string;
    quantity: string;
}

export interface Status {
    id: string;
    name: string;
    code: number;
}
export interface MerchantOrder {
    id: string;
    created_on: string;
    delivery_address_id: string;
    delivery_address: Address;
    outlet: Outlet;
    order_id: string;
    prep_time: number;
    delivery_address_location: Geom;
    outlet_id: string;
    delivery_location: Geom;
    customer_id: string;
    customer: Customer;
    otp: number;
}
export interface Outlet {
    id: string;
    name: string;
    address_id: string;
    external_id: string;
    address: Address;
    merchants: MerchantOrder;
    zone_id: string;
    zone: Zone;
    brand_id: string;
    prep_time: number;
    mobile_number: string;
    is_premium: boolean;
    email: string;
    categories: any[];
    store_timing_start: string;
    store_timing_end: string;
    start_timing_on_Weekend: string;
    end_timing_on_Weekend: string;
    agreed_wait_time: number;
    country: string;
    state: string;
    city: string;

}
