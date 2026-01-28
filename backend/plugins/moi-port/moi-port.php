<?php
/**
 * Plugin Name: MOI Port
 * Plugin URI: https://moiport.com
 * Description: Ajans paneliniz ile WordPress siteniz arasında güvenli bağlantı kurar, içeriklerinizi otomatik senkronize eder.
 * Version: 1.1.0
 * Author: MOI PORT AI
 * Author URI: https://moiport.com
 * License: GPLv2 or later
 */

if (!defined('ABSPATH')) {
    exit;
}

class MoiPortPlugin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_action_links'));
    }

    public function add_action_links($links) {
        $settings_link = '<a href="admin.php?page=moi-port">Ayarlar</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    public function add_admin_menu() {
        add_menu_page(
            'MOI Port Ayarları',
            'MOI Port',
            'manage_options',
            'moi-port',
            array($this, 'settings_page'),
            'dashicons-cloud',
            100
        );
    }

    public function register_settings() {
        register_setting('moi_port_options', 'moi_port_api_key');
    }

    public function settings_page() {
        // Bağlantıyı kopar işlemi
        if (isset($_POST['moi_disconnect']) && check_admin_referer('moi_disconnect_action', 'moi_disconnect_nonce')) {
            delete_option('moi_port_api_key');
            echo '<div class="notice notice-success is-dismissible"><p>Bağlantı koparıldı.</p></div>';
        }

        $api_key = get_option('moi_port_api_key');
        ?>
        <div class="wrap">
            <h1>MOI Port Entegrasyonu</h1>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); max-width: 600px; margin-top: 20px;">
                <?php if ($api_key): ?>
                    <div style="text-align: center; color: #00a32a;">
                        <span class="dashicons dashicons-yes-alt" style="font-size: 64px; width: 64px; height: 64px;"></span>
                        <h2>Bağlantı Aktif</h2>
                        <p>Siteniz ajans paneli ile başarıyla eşleştirildi.</p>
                        
                        <form method="post" action="" style="margin-top: 20px;">
                            <?php wp_nonce_field('moi_disconnect_action', 'moi_disconnect_nonce'); ?>
                            <input type="hidden" name="moi_disconnect" value="1">
                            <button type="submit" class="button button-link-delete" onclick="return confirm('Bağlantıyı koparmak istediğinize emin misiniz?');">Bağlantıyı Kopar</button>
                        </form>
                    </div>
                <?php else: ?>
                    <?php
                    // Mevcut bir kod var mı kontrol et, yoksa oluştur
                    $code = get_transient('moi_port_connection_code');
                    if (!$code) {
                        $code = wp_generate_password(6, false, false); // 6 karakterli basit kod
                        set_transient('moi_port_connection_code', $code, 15 * MINUTE_IN_SECONDS);
                    }
                    ?>
                    <div style="text-align: center;">
                        <h2>Kurulum Sihirbazı</h2>
                        <p>Aşağıdaki bağlantı kodunu kopyalayın ve ajans panelinizdeki "Yeni Site Ekle" alanına yapıştırın.</p>
                        
                        <div style="background: #f0f0f1; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border: 2px dashed #2271b1; display: inline-block;">
                            <?php echo esc_html($code); ?>
                        </div>
                        
                        <p class="description">Bu kod 15 dakika boyunca geçerlidir. Süre dolarsa sayfayı yenileyin.</p>
                        
                        <hr style="margin: 20px 0;">
                        
                        <p><strong>Site Adresi:</strong> <?php echo site_url(); ?></p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    public function register_api_endpoints() {
        // Mevcut içerik oluşturma endpoint'i
        register_rest_route('moi-port/v1', '/post', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_post_creation'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));

        register_rest_route('moi-port/v1', '/post/(?P<id>\d+)', array(
            'methods' => array('POST', 'PUT', 'PATCH'),
            'callback' => array($this, 'handle_post_update'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));

        register_rest_route('moi-port/v1', '/post/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'handle_post_delete'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));

        // Yeni doğrulama endpoint'i
        register_rest_route('moi-port/v1', '/verify-code', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_verification'),
            'permission_callback' => '__return_true', // Public endpoint
        ));

        // Yeni kategorileri listeleme endpoint'i
        register_rest_route('moi-port/v1', '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => array($this, 'check_api_permission'),
        ));
    }

    public function get_categories($request) {
        $categories = get_categories(array(
            'hide_empty' => false,
            'taxonomy' => 'category'
        ));

        $data = array();
        foreach ($categories as $category) {
            $data[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'count' => $category->count
            );
        }

        return $data;
    }

    public function handle_verification($request) {
        $params = $request->get_json_params();
        $code = isset($params['code']) ? $params['code'] : '';
        $api_key = isset($params['api_key']) ? $params['api_key'] : '';

        $stored_code = get_transient('moi_port_connection_code');

        if (empty($code) || empty($stored_code) || $code !== $stored_code) {
            return new WP_Error('invalid_code', 'Geçersiz veya süresi dolmuş bağlantı kodu.', array('status' => 403));
        }
        
        if (empty($api_key)) {
            return new WP_Error('missing_key', 'API anahtarı eksik.', array('status' => 400));
        }

        update_option('moi_port_api_key', $api_key);
        delete_transient('moi_port_connection_code');

        return array(
            'success' => true,
            'message' => 'Bağlantı başarıyla kuruldu.'
        );
    }

    public function check_api_permission($request) {
        $api_key = $request->get_header('X-Moi-Port-Key');
        $stored_key = get_option('moi_port_api_key');
        
        if (empty($stored_key) || $api_key !== $stored_key) {
            return new WP_Error('rest_forbidden', 'Geçersiz API Anahtarı', array('status' => 403));
        }
        return true;
    }

    public function handle_post_creation($request) {
        $params = $request->get_json_params();

        if (empty($params['title']) || empty($params['content'])) {
            return new WP_Error('missing_params', 'Başlık ve içerik zorunludur.', array('status' => 400));
        }

        $post_data = array(
            'post_title'    => sanitize_text_field($params['title']),
            'post_content'  => wp_kses_post($params['content']),
            'post_status'   => !empty($params['status']) ? sanitize_text_field($params['status']) : 'draft',
            'post_author'   => get_current_user_id() ?: 1,
            'post_type'     => 'post',
        );

        // Tarih ve zaman planlama
        if (!empty($params['date_gmt'])) {
            // GMT zamanını kullan (En güvenli yöntem)
            $post_data['post_date_gmt'] = $params['date_gmt'];
            // post_date'i WordPress'in hesaplamasına bırak (GMT'den yerel saate çevirir)
            $post_data['edit_date'] = true;
            if ($params['status'] === 'future') {
                $post_data['post_status'] = 'future';
            }
        } elseif (!empty($params['date'])) {
            // Yedek: Sadece yerel saat gönderildiyse
            $post_data['post_date'] = $params['date'];
            $post_data['edit_date'] = true;
            if ($params['status'] === 'future') {
                $post_data['post_status'] = 'future';
            }
        }

        // Kategori ekleme
        if (!empty($params['categories']) && is_array($params['categories'])) {
            $post_data['post_category'] = array_map('intval', $params['categories']);
        }

        $post_id = wp_insert_post($post_data);

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        // Etiket ekleme
        if (!empty($params['tags']) && is_array($params['tags'])) {
            wp_set_post_tags($post_id, $params['tags']);
        }

        // Handle Featured Image if URL provided
        if (!empty($params['featured_image_url'])) {
            $this->set_featured_image($post_id, $params['featured_image_url']);
        }

        return array(
            'success' => true,
            'post_id' => $post_id,
            'post_url' => get_permalink($post_id)
        );
    }

    public function handle_post_update($request) {
        $post_id = intval($request->get_param('id'));
        if (!$post_id) {
            return new WP_Error('missing_id', 'Yazı ID zorunludur.', array('status' => 400));
        }

        $existing = get_post($post_id);
        if (!$existing || $existing->post_type !== 'post') {
            return new WP_Error('not_found', 'Yazı bulunamadı.', array('status' => 404));
        }

        $params = $request->get_json_params();
        if (!is_array($params)) $params = array();

        $post_data = array(
            'ID' => $post_id,
        );

        if (array_key_exists('title', $params)) {
            $post_data['post_title'] = sanitize_text_field($params['title']);
        }

        if (array_key_exists('content', $params)) {
            $post_data['post_content'] = wp_kses_post($params['content']);
        }

        if (!empty($params['status'])) {
            $post_data['post_status'] = sanitize_text_field($params['status']);
        }

        if (!empty($params['date_gmt'])) {
            $post_data['post_date_gmt'] = $params['date_gmt'];
            $post_data['edit_date'] = true;
            if (!empty($params['status']) && $params['status'] === 'future') {
                $post_data['post_status'] = 'future';
            }
        }

        $result = wp_update_post($post_data, true);
        if (is_wp_error($result)) {
            return $result;
        }

        if (array_key_exists('categories', $params) && is_array($params['categories'])) {
            $cat_ids = array_map('intval', $params['categories']);
            wp_set_post_categories($post_id, $cat_ids);
        }

        if (array_key_exists('tags', $params) && is_array($params['tags'])) {
            wp_set_post_tags($post_id, $params['tags']);
        }

        if (array_key_exists('featured_image_url', $params) && !empty($params['featured_image_url'])) {
            $this->set_featured_image($post_id, $params['featured_image_url']);
        }

        return array(
            'success' => true,
            'post_id' => $post_id,
            'post_url' => get_permalink($post_id)
        );
    }

    public function handle_post_delete($request) {
        $post_id = intval($request->get_param('id'));
        if (!$post_id) {
            return new WP_Error('missing_id', 'Yazı ID zorunludur.', array('status' => 400));
        }

        $existing = get_post($post_id);
        if (!$existing || $existing->post_type !== 'post') {
            return new WP_Error('not_found', 'Yazı bulunamadı.', array('status' => 404));
        }

        $trashed = wp_trash_post($post_id);
        if (!$trashed) {
            return new WP_Error('delete_failed', 'Yazı silinemedi.', array('status' => 500));
        }

        return array(
            'success' => true,
            'post_id' => $post_id
        );
    }

    private function set_featured_image($post_id, $image_url) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        $desc = "MOI Port AI Image";
        $media = media_sideload_image($image_url, $post_id, $desc, 'id');

        if (!is_wp_error($media)) {
            set_post_thumbnail($post_id, $media);
        }
    }
}

new MoiPortPlugin();
