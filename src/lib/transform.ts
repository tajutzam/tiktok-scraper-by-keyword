function urlStruct(url?: string | null, width?: number, height?: number) {
    if (!url) return null;
    return {
        uri: "",
        url_list: [url],
        width: width ?? 0,
        height: height ?? 0,
    };
}

function mapBitRateItem(b: any) {
    return {
        gear_name: b?.GearName ?? "",
        quality_type: b?.QualityType ?? 0,
        bit_rate: b?.Bitrate ?? 0,
        is_bytevc1: b?.CodecType === "h265_hvc1" || b?.CodecType === "bytevc1" ? 1 : 0,
        dub_infos: null,
        HDR_type: "",
        HDR_bit: "",
        play_addr: {
            uri: b?.PlayAddr?.Uri ?? "",
            url_list: b?.PlayAddr?.UrlList ?? [],
            width: b?.PlayAddr?.Width ?? 0,
            height: b?.PlayAddr?.Height ?? 0,
            data_size: b?.PlayAddr?.DataSize ?? 0,
            file_hash: b?.PlayAddr?.FileHash ?? "",
            file_cs: b?.PlayAddr?.FileCs ?? "",
            url_key: b?.PlayAddr?.UrlKey ?? "",
        },
    };
}

function mapVideo(video: any) {
    if (!video) return null;

    return {
        cover: urlStruct(video.cover, video.width, video.height),
        origin_cover: urlStruct(video.originCover, video.width, video.height),
        dynamic_cover: urlStruct(video.dynamicCover, video.width, video.height),
        ai_dynamic_cover: urlStruct(video.dynamicCover, video.width, video.height),
        animated_cover: urlStruct(video.dynamicCover, video.width, video.height),
        play_addr: {
            uri: video.videoID ?? "",
            url_list: [video.playAddr].filter(Boolean),
            width: video.width ?? 0,
            height: video.height ?? 0,
            data_size: video.size ?? 0,
            url_key: "",
            file_hash: "",
            file_cs: "",
        },
        download_addr: {
            uri: video.videoID ?? "",
            url_list: [video.downloadAddr].filter(Boolean),
            width: video.width ?? 0,
            height: video.height ?? 0,
            data_size: video.size ?? 0,
        },
        play_addr_h264: video.codecType === "h264" ? {
            uri: video.videoID ?? "",
            url_list: [video.playAddr].filter(Boolean),
            width: video.width ?? 0,
            height: video.height ?? 0,
            data_size: video.size ?? 0,
            url_key: "",
            file_hash: "",
            file_cs: "",
        } : null,
        play_addr_bytevc1: video.codecType !== "h264" ? {
            uri: video.videoID ?? "",
            url_list: [video.playAddr].filter(Boolean),
            width: video.width ?? 0,
            height: video.height ?? 0,
            data_size: video.size ?? 0,
            url_key: "",
            file_hash: "",
            file_cs: "",
        } : null,
        bit_rate: Array.isArray(video.bitrateInfo) ? video.bitrateInfo.map(mapBitRateItem) : [],
        big_thumbs: [],
        height: video.height ?? 0,
        width: video.width ?? 0,
        duration: video.duration ? video.duration * 1000 : 0,
        ratio: video.ratio ?? "",
        has_watermark: false,
        is_bytevc1: video.codecType === "h264" ? 0 : 1,
        is_callback: true,
        need_set_token: false,
        source_HDR_type: 0,
        cover_is_custom: false,
        size: video.size ?? 0,
        VQScore: video.VQScore ?? "",
        videoID: video.videoID ?? "",
        tags: video.videoTags ?? null,
        cdn_url_expired: 0,
        meta: "",
    };
}

function mapAuthor(author: any) {
    if (!author) return null;

    return {
        uid: author.id ?? "",
        short_id: "0",
        unique_id: author.uniqueId ?? "",
        nickname: author.nickname ?? "",
        signature: author.signature ?? "",
        avatar_thumb: urlStruct(author.avatarThumb),
        avatar_medium: urlStruct(author.avatarMedium),
        avatar_larger: urlStruct(author.avatarLarger),
        verified: author.verified ?? false,
        sec_uid: author.secUid ?? "",
        secret: author.secret ?? false,
        ftc: author.ftc ?? false,
        relation: author.relation ?? 0,
        open_favorite: author.openFavorite ?? false,
        comment_setting: author.commentSetting ?? 0,
        duet_setting: author.duetSetting ?? 0,
        stitch_setting: author.stitchSetting ?? 0,
        private_account: author.privateAccount ?? false,
        is_ad_virtual: author.isADVirtual ?? false,
        download_setting: author.downloadSetting ?? 0,
        is_embed_banned: author.isEmbedBanned ?? false,
        region: author.region ?? "",
        room_id: String(author.roomId ?? "0"),
        follow_status: author.followStatus ?? 0,
        follower_status: author.followerStatus ?? 0,
    };
}

function mapMusic(music: any) {
    if (!music) return null;

    return {
        id: music.id ?? "",
        id_str: String(music.id ?? ""),
        title: music.title ?? "",
        author: music.authorName ?? "",
        album: music.album ?? "",
        play_url: urlStruct(music.playUrl),
        cover_thumb: urlStruct(music.coverThumb),
        cover_medium: urlStruct(music.coverMedium),
        cover_large: urlStruct(music.coverLarge),
        duration: music.duration ?? 0,
        original: music.original ?? false,
        is_original_sound: music.original ?? false,
        is_commerce_music: false,
        is_pgc: music.isPgc ?? false,
        mid: String(music.id ?? ""),
        owner_nickname: music.ownerNickname ?? "",
        owner_handle: music.ownerHandle ?? "",
        user_count: music.userCount ?? 0,
        collect_stat: 0,
    };
}

function mapChallenges(challenges: any) {
    if (!Array.isArray(challenges)) return null;

    return challenges.map((c) => ({
        cid: c.id ?? "",
        cha_name: c.title ?? "",
        desc: c.desc ?? "",
        is_commerce: c.isCommerce ?? false,
        user_count: c.userCount ?? 0,
        view_count: c.viewCount ?? 0,
        type: c.type ?? 1,
        is_challenge: c.isChallenge ?? 0,
        is_pgcshow: c.isPgcshow ?? false,
        schema: c.schema ?? "",
    }));
}

function mapTextExtra(textExtra: any) {
    if (!Array.isArray(textExtra)) return null;

    return textExtra.map((t) => ({
        start: t.start ?? 0,
        end: t.end ?? 0,
        type: t.type ?? 1,
        hashtag_id: t.hashtagId ?? "",
        hashtag_name: t.hashtagName ?? "",
        user_id: t.userId ?? "",
        sec_uid: t.secUid ?? "",
        is_commerce: t.isCommerce ?? false,
        aweme_id: t.awemeId ?? "",
        sub_type: t.subType ?? 0,
    }));
}

function mapStatistics(stats: any, awemeId: string) {
    if (!stats) return null;

    return {
        aweme_id: awemeId,
        comment_count: stats.commentCount ?? 0,
        digg_count: stats.diggCount ?? 0,
        play_count: stats.playCount ?? 0,
        share_count: stats.shareCount ?? 0,
        collect_count: stats.collectCount ?? 0,
        download_count: 0,
        forward_count: 0,
        lose_count: 0,
        lose_comment_count: 0,
        whatsapp_share_count: 0,
    };
}

function mapAuthorStats(authorStats: any) {
    if (!authorStats) return null;

    return {
        following_count: authorStats.followingCount ?? 0,
        follower_count: authorStats.followerCount ?? 0,
        heart_count: authorStats.heartCount ?? 0,
        heart: authorStats.heart ?? authorStats.heartCount ?? 0,
        video_count: authorStats.videoCount ?? 0,
        digg_count: authorStats.diggCount ?? 0,
        friend_count: authorStats.friendCount ?? 0,
    };
}

export function mapAwemeInfoToSimple(rawItem: any, keyword?: string): any {
    if (!rawItem || typeof rawItem !== "object") return rawItem;

    return {
        id: rawItem.id ?? "",
        desc: rawItem.desc ?? "",
        createTime: rawItem.createTime ?? 0,
        author: {
            id: rawItem.author?.id ?? "",
            uniqueId: rawItem.author?.uniqueId ?? "",
            nickname: rawItem.author?.nickname ?? "",
            avatarThumb: rawItem.author?.avatarThumb ?? "",
        },
        stats: {
            diggCount: rawItem.stats?.diggCount ?? 0,
            commentCount: rawItem.stats?.commentCount ?? 0,
            shareCount: rawItem.stats?.shareCount ?? 0,
            playCount: rawItem.stats?.playCount ?? 0,
            collectCount: rawItem.stats?.collectCount ?? 0,
        },
        video: {
            cover: rawItem.video?.cover ?? "",
            playAddr: rawItem.video?.playAddr ?? "",
            downloadAddr: rawItem.video?.downloadAddr ?? "",
            duration: rawItem.video?.duration ?? 0,
        },
        musicMeta: rawItem.music
            ? {
                  id: rawItem.music.id ?? "",
                  title: rawItem.music.title ?? "",
                  authorName: rawItem.music.authorName ?? "",
                  playUrl: rawItem.music.playUrl ?? "",
              }
            : undefined,
        webVideoUrl: `https://www.tiktok.com/@${rawItem.author?.uniqueId}/video/${rawItem.id}`,
        scraping_metadata: {
            keyword,
            capturedAt: new Date().toISOString(),
        },
    };
}

export function mapAwemeInfoToSnakeCase(rawItem: any): any {
    if (!rawItem || typeof rawItem !== "object") return rawItem;

    const awemeId = rawItem.id ?? "";

    return {
        aweme_id: awemeId,
        desc: rawItem.desc ?? "",
        create_time: rawItem.createTime ?? 0,
        video: mapVideo(rawItem.video),
        author: mapAuthor(rawItem.author),
        author_user_id: rawItem.author?.id ? Number(rawItem.author.id) : undefined,
        music: mapMusic(rawItem.music),
        cha_list: mapChallenges(rawItem.challenges),
        statistics: mapStatistics(rawItem.stats, awemeId),
        text_extra: mapTextExtra(rawItem.textExtra),
        author_stats: mapAuthorStats(rawItem.authorStats),
        secret: rawItem.secret ?? false,
        for_friend: rawItem.forFriend ?? false,
        digged: rawItem.digged ?? false,
        item_comment_status: rawItem.itemCommentStatus ?? 0,
        private_item: rawItem.privateItem ?? false,
        duet_enabled: rawItem.duetEnabled ?? false,
        stitch_enabled: rawItem.stitchEnabled ?? false,
        share_enabled: rawItem.shareEnabled ?? false,
        is_ads: rawItem.isAd ?? false,
        duet_display: rawItem.duetDisplay ?? 0,
        stitch_display: rawItem.stitchDisplay ?? 0,
        original_item: rawItem.originalItem ?? false,
        offical_item: rawItem.officalItem ?? false,
        collected: rawItem.collected ?? false,
        text_language: rawItem.textLanguage ?? "",
        text_translatable: rawItem.textTranslatable ?? false,
        is_reviewing: rawItem.isReviewing ?? false,
        risk_infos: {
            risk_sink: false,
            type: 0,
            content: "",
            vote: false,
            warn: false,
        },
        video_labels: [],
        status: {
            aweme_id: awemeId,
            allow_comment: true,
            allow_share: true,
            private_status: 0,
            in_reviewing: false,
            self_see: false,
            is_delete: false,
            reviewed: 1,
            is_prohibited: false,
        },
        share_info: {
            share_url: rawItem.shareInfo?.shareUrl ?? "",
            share_title: rawItem.shareInfo?.shareTitle ?? "",
            share_desc: rawItem.shareInfo?.shareDesc ?? "",
        },
        share_url: rawItem.shareUrl ?? "",
    };
}
