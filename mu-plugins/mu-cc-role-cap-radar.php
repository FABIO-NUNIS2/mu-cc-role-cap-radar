<?php
/**
 * Plugin Name: CC Role Cap Radar ( MU )
 * Description: Backend floating radar per visualizzare tutte le capability
 *              disponibili nel sistema e il match con l’utente loggato.
 * Author: CodeCorn
 * Version: 1.0.15
 */

defined('ABSPATH') || exit; // Exit if accessed directly

class CC_Role_Cap_Radar
{

    private const string HANDLE_JS = 'cc-role-cap-radar';
    private const string HANDLE_CSS = 'cc-role-cap-radar';
    private const string HANDLE_DT_CSS = 'cc-datatables';
    private const string HANDLE_DT_JS = 'cc-datatables';

    private const NONCE_KEY = 'cc_role_cap_radar_nonce';

    public static function init()
    {
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_assets']);
        add_action('wp_ajax_cc_role_cap_toggle', [__CLASS__, 'ajax_toggle_cap']);
    }

    /**
     * Enqueue asset admin + passaggio dati a JS.
     */
    public static function enqueue_assets()
    {

        if (!is_user_logged_in()) {
            return;
        }
        $user = wp_get_current_user();
        // Tutti i ruoli
        $roles = wp_roles()->roles;

        // 🔎 Raccoglie TUTTE le capability esistenti ( nessun hardcode )
        $all_caps = [];

        foreach ($roles as $role) {
            $all_caps = [
                ...$all_caps,
                ...array_keys($role['capabilities']),
            ];

        }
        $all_caps = array_values(array_unique($all_caps));
        sort($all_caps);


        // Capability dell’utente corrente
        $user_caps = array_keys(array_filter($user->allcaps));

        $base_url = WPMU_PLUGIN_URL . '/codecorn/role-cap-radar/';
        $base_path = WPMU_PLUGIN_DIR . '/codecorn/role-cap-radar/';

        // CSS
        wp_register_style(
            self::HANDLE_CSS,
            "{$base_url}assets/css/cc-role-cap-radar.css",
            [],
            filemtime("{$base_path}assets/css/cc-role-cap-radar.css")
        );
        wp_enqueue_style(self::HANDLE_CSS);

        // JS
        wp_register_script(
            self::HANDLE_JS,
            "{$base_url}assets/js/cc-role-cap-radar.js",
            ['jquery'],
            filemtime("{$base_path}assets/js/cc-role-cap-radar.js"),
            true
        );
        wp_enqueue_script(self::HANDLE_JS);
        // DataTables CSS
        wp_enqueue_style(
            'datatables',
            'https://cdn.datatables.net/1.13.8/css/jquery.dataTables.min.css',
            [],
            '1.13.8'
        );

        // DataTables JS
        wp_enqueue_script(
            'datatables',
            'https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js',
            ['jquery'],
            '1.13.8',
            true
        );

        // Passaggio dati ( NO inline logic )
        wp_localize_script(
            self::HANDLE_JS,
            'CC_ROLE_CAP_RADAR_DATA',
            [
                'roles' => $roles,
                'allCaps' => $all_caps,
                'currentUser' => [
                    'id' => $user->ID,
                    'roles' => $user->roles,
                    'isAdmin' => user_can($user, 'administrator'),
                ],
                'ajax' => [
                    'url' => admin_url('admin-ajax.php'),
                    'nonce' => wp_create_nonce(self::NONCE_KEY),
                ],
            ]
        );
    }

    /**
     * AJAX : toggle capability su ruolo.
     */
    public static function ajax_toggle_cap()
    {

        check_ajax_referer(self::NONCE_KEY, 'nonce');

        if (!current_user_can('administrator')) {
            wp_send_json_error('Not allowed');
        }

        $role = sanitize_text_field($_POST['role'] ?? '');
        $cap = sanitize_text_field($_POST['cap'] ?? '');
        $val = filter_var($_POST['value'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $wp_role = get_role($role);
        if (!$wp_role || !$cap) {
            wp_send_json_error('Invalid role or cap');
        }

        $val ? $wp_role->add_cap($cap) : $wp_role->remove_cap($cap);

        wp_send_json_success([
            'role' => $role,
            'cap' => $cap,
            'val' => $val,
        ]);
    }
}

CC_Role_Cap_Radar::init();
