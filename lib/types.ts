export type Category = { id: number; name: string }
export type Paper = {
id: string
title: string
year: number | null
keywords_text: string | null
authors_text: string | null
category_id: number | null
storage_path: string
}